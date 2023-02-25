from starlite import Controller, get
from util._types import AppState
from util.exceptions import ApplicationException
import uuid
from urllib.parse import quote
from pydantic import BaseModel
from requests import post, Response
from github import Github
from github.AuthenticatedUser import AuthenticatedUser
from models.user import User, GithubAccount
import hashlib

SCOPES = ["repo", "admin:repo_hook", "user", "workflow"]
DEV_URL = "http://localhost:3000"

class AuthResult(BaseModel):
    session_id: str
    user_id: str
    action: str

class GithubController(Controller):
    path = "/gh"
    pending: list[str] = []

    def encode_user_to_secret(self, user: AuthenticatedUser) -> str:
        return "_gh_auth-" + hashlib.sha256(f"{user.login}-{user.id}".encode("utf-8")).hexdigest()

    @get("/flow/1/login")
    async def create_auth_flow_uri_login(self, app_state: AppState) -> str:
        state = uuid.uuid4().hex + "-login"
        self.pending.append(state)
        return f"https://github.com/login/oauth/authorize?client_id={app_state.gh_client}&redirect_uri={quote(app_state.gh_redirect)}/auth/target&scope={quote(' '.join(SCOPES))}&state={state}"

    @get("/flow/2/login")
    async def acquire_access_token_login(self, app_state: AppState, state_key: str, code: str) -> AuthResult:
        if state_key in self.pending:
            self.pending.remove(state_key)
            response: Response = post("https://github.com/login/oauth/access_token", params={"client_id": app_state.gh_client, "client_secret": app_state.gh_secret, "code": code}, headers={"Accept": "application/json"})
            if response.status_code >= 400:
                raise ApplicationException(code=403, error_name="err.github.token_failed")
            
            token = response.json()["access_token"]
            gh = Github(token)
            gh_user = gh.get_user()
            
            existing: list[User] = User.load(app_state.database, query={"username": gh_user.login})
            if len(existing) == 0:
                new_user = User.create(app_state.database, gh_user.login, "")
                new_user.password_hash = self.encode_user_to_secret(gh_user)
                new_user.accounts.append(GithubAccount(token=token, username=gh_user.login, avatar=gh_user.avatar_url, id=gh_user.id))
                new_user.save()
                login = new_user.login()
                return AuthResult(session_id=login.id, user_id=new_user.id, action="create_account")
            else:
                user = existing[0]
                found = False
                for a in user.accounts:
                    if a["id"] == gh_user.id:
                        a["token"] = token
                        found = True
                        break
                
                if not found:
                    user.accounts.append(GithubAccount(
                        token=token, username=gh_user.login, avatar=gh_user.avatar_url, id=gh_user.id
                    ))
                user.save()
                login = user.login()
                return AuthResult(session_id=login.id, user_id=user.id, action="login")
                
                
        else:
            raise ApplicationException(code=403, error_name="err.github.state_invalid")

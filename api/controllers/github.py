from typing import Optional
from starlite import Controller, get, Provide
from util._types import AppState, PaginatedResponse
from util.exceptions import ApplicationException
from util.guards import is_logged_in
from util.dependencies import dep_user
import uuid
from urllib.parse import quote, parse_qs, urlparse
from pydantic import BaseModel
from requests import post, Response
from github import Github
from github.Repository import Repository
from models.user import User, GithubAccount

SCOPES = ["repo", "admin:repo_hook", "user", "workflow"]
DEV_URL = "http://localhost:3000"


class AuthResult(BaseModel):
    session_id: str
    user_id: str
    action: str


class GithubRepository(BaseModel):
    id: int
    name: str
    url: str
    forks: int
    stars: int
    watchers: int

    @classmethod
    def from_repo(cls, repo: Repository):
        return cls(
            id=repo.id,
            name=repo.name,
            url=repo.html_url,
            forks=repo.forks_count,
            stars=repo.stargazers_count,
            watchers=repo.watchers_count,
        )


class GithubController(Controller):
    path = "/gh"
    pending: list[str] = []

    @get("/flow/1/login")
    async def create_auth_flow_uri_login(self, app_state: AppState) -> str:
        state = uuid.uuid4().hex + "-login"
        self.pending.append(state)
        return f"https://github.com/login/oauth/authorize?client_id={app_state.gh_client}&redirect_uri={quote(app_state.gh_redirect)}/auth/target&scope={quote(' '.join(SCOPES))}&state={state}"

    @get("/flow/2/login")
    async def acquire_access_token_login(
        self, app_state: AppState, state_key: str, code: str
    ) -> AuthResult:
        if state_key in self.pending:
            self.pending.remove(state_key)
            response: Response = post(
                "https://github.com/login/oauth/access_token",
                params={
                    "client_id": app_state.gh_client,
                    "client_secret": app_state.gh_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            if response.status_code >= 400:
                raise ApplicationException(
                    code=403, error_name="err.github.token_failed"
                )

            token = response.json()["access_token"]
            gh = Github(token)
            gh_user = gh.get_user()

            existing: list[User] = User.load(
                app_state.database,
                query={"username": gh_user.login, "user_type": "github"},
            )
            if len(existing) == 0:
                new_user = User.create_from_github(app_state.database, gh_user, token)
                login = new_user.login()
                return AuthResult(
                    session_id=login.id, user_id=new_user.id, action="create_account"
                )
            else:
                user = existing[0]
                found = False
                for a in user.accounts:
                    if a["id"] == gh_user.id:
                        a["token"] = token
                        found = True
                        break

                if not found:
                    user.accounts.append(
                        GithubAccount(
                            token=token,
                            username=gh_user.login,
                            avatar=gh_user.avatar_url,
                            id=gh_user.id,
                        )
                    )
                user.save()
                login = user.login()
                return AuthResult(session_id=login.id, user_id=user.id, action="login")

        else:
            raise ApplicationException(code=403, error_name="err.github.state_invalid")


class GithubUserController(Controller):
    path = "/gh/{username:str}"

    @get(
        "/repositories/count",
        guards=[is_logged_in],
        dependencies={"user": Provide(dep_user)},
    )
    async def count_user_repositories(self, username: str, user: User) -> int:
        gh_user = user.get_github(username)
        return gh_user.get_repos().totalCount

    @get(
        "/repositories", guards=[is_logged_in], dependencies={"user": Provide(dep_user)}
    )
    async def get_user_repositories(
        self, username: str, user: User, page: Optional[int] = 0
    ) -> PaginatedResponse:
        gh_user = user.get_github(username)
        repos = gh_user.get_repos(sort="updated")
        last_page = int(parse_qs(urlparse(repos._getLastPageUrl()).query)["page"][0])
        if page < 0 or page >= last_page:
            raise ApplicationException(
                code=400, error_name="err.pagination.invalid_page"
            )

        return PaginatedResponse(
            count=repos.totalCount,
            pages=last_page,
            current_page=page,
            page_content=[GithubRepository.from_repo(i) for i in repos.get_page(page)],
            previous=f"/gh/{username}/repositories?page={page - 1}"
            if page > 0
            else None,
            next=f"/gh/{username}/repositories?page={page + 1}"
            if page < last_page - 1
            else None,
        )

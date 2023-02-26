from typing import Optional, Union
from starlite import Controller, get, Provide, post, Request
from util._types import AppState, PaginatedResponse
from util.exceptions import ApplicationException
from util.guards import is_logged_in
from util.dependencies import dep_user
import uuid
from urllib.parse import quote, parse_qs, urlparse
from pydantic import BaseModel
from requests import Response
import requests
from github import Github
from github.Repository import Repository
from models.user import User, GithubAccount
from models.scan import Scan

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
    language: Union[str, None]
    visibility: str
    default_branch: str

    @classmethod
    def from_repo(cls, repo: Repository):
        return cls(
            id=repo.id,
            name=repo.name,
            url=repo.html_url,
            forks=repo.forks_count,
            stars=repo.stargazers_count,
            watchers=repo.watchers_count,
            language=repo.language,
            visibility=repo.visibility,
            default_branch=repo.default_branch
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
            response: Response = requests.post(
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
        gh_user = user.get_github(username).get_user()
        return gh_user.get_repos().totalCount

    @get(
        "/repositories", guards=[is_logged_in], dependencies={"user": Provide(dep_user)}
    )
    async def get_user_repositories(
        self, username: str, user: User, page: Optional[int] = 0, search: Optional[str] = ""
    ) -> PaginatedResponse:
        gh_user = user.get_github(username).get_user()
        if len(search) == 0:
            repos = gh_user.get_repos(sort="updated")
        else:
            repos = user.get_github(username).search_repositories(search, user=username)
        try:
            last_page = int(parse_qs(urlparse(repos._getLastPageUrl()).query)["page"][0])
        except:
            last_page = 0
        if page < 0 or page >= last_page and last_page != 0:
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

def dep_github(user: User, username: str) -> Github:
    return user.get_github(username)

def dep_repo(github: Github, repository: int) -> Repository:
    return github.get_repo(repository)

class GithubRepositoryController(Controller):
    path = "/gh/{username:str}/repositories/{repository:int}"
    dependencies = {"user": Provide(dep_user), "github": Provide(dep_github), "repo": Provide(dep_repo)}

    @get("")
    async def get_repo(self, repo: Repository, request: Request) -> GithubRepository:
        return GithubRepository.from_repo(repo)
    
    @get("/scan")
    async def check_repo(self, app_state: AppState, username: str, repository: int, branch: Optional[str] = "main") -> Union[bool, Scan]:
        results = Scan.load(app_state.database, query={"user": username, "repository": repository, "branch": branch})
        if len(results) == 0:
            return False
        else:
            return results[0]
    
    @post("/scan")
    async def scan_repo(self, app_state: AppState, username: str, repo: Repository, branch: Optional[str] = "main") -> Scan:
        results: list[Scan] = Scan.load(app_state.database, query={"user": username, "repository": repo.id, "branch": branch})
        if len(results) == 0:
            return Scan.scan(app_state.database, username, repo, branch=branch)
        else:
            results[0].update(repo)
            return results[0]
    
    @get("/branches")
    async def get_branches(self, repo: Repository) -> list[str]:
        branches = repo.get_branches()
        return [i.name for i in branches]

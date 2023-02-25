from dataclasses import dataclass
from pymongo.database import Database
from typing import TypedDict, Any, Union
from starlite import State
from pydantic import BaseModel

@dataclass
class AppState:
    database: Database
    gh_client: str
    gh_secret: str
    gh_redirect: str
    dev_mode: bool

def get_app_state(state: State) -> AppState:
    return AppState(
        database=state.database,
        gh_client=state.gh_client,
        gh_secret=state.gh_secret,
        gh_redirect=state.gh_redirect,
        dev_mode=state.dev_mode
    )

class ErrorResponse(TypedDict):
    detail: str
    error: str


class PaginatedResponse(BaseModel):
    count: int
    pages: int
    current_page: int
    page_content: list[Any]
    previous: Union[None, str]
    next: Union[None, str]
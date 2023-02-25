from dataclasses import dataclass
from pymongo.database import Database
from typing import TypedDict
from starlite import State

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
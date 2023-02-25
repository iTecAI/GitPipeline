from dataclasses import dataclass
from pymongo.database import Database
from typing import TypedDict
from starlite import State

@dataclass
class AppState:
    database: Database

def get_app_state(state: State) -> AppState:
    return AppState(
        database=state.database
    )

class ErrorResponse(TypedDict):
    detail: str
    error: str
from dataclasses import dataclass
from pymongo.database import Database
from typing import TypedDict
from starlite import Starlite

@dataclass
class AppState:
    database: Database

def get_app_state(app: Starlite) -> AppState:
    return AppState(
        database=app.state.database
    )

class ErrorResponse(TypedDict):
    detail: str
    error: str
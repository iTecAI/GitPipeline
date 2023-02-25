from starlite import Request
from util._types import AppState
from util.exceptions import AuthenticationException
from models.user import Session, User

def dep_session(request: Request, app_state: AppState) -> Session:
    try:
        return Session.load(app_state.database, id=request.headers.get("authorization", ""))
    except:
        raise AuthenticationException()
    
def dep_user(request: Request, app_state: AppState) -> User:
    try:
        return Session.load(app_state.database, id=request.headers.get("authorization", "")).User
    except:
        raise AuthenticationException()
from starlite import post, get, Controller
from pydantic import BaseModel
from util._types import AppState
from models import User, Session

class CreateUserModel(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    user: str
    session: str

class UserController(Controller):
    path = "/users"

    @post("", status_code=201)
    async def create_user(self, app_state: AppState, data: CreateUserModel) -> LoginResponse:
        new_user = User.create(app_state.database, data.email, data.password)
        session = new_user.login()
        return LoginResponse(user=new_user.id, session=session.id)
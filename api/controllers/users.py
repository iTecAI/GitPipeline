from starlite import post, get, Controller, Provide, delete
from pydantic import BaseModel
from util._types import AppState
from models import User, Session
from util.exceptions import *
from hashlib import sha256
from util.guards import is_logged_in
from util.dependencies import dep_user, dep_session


class UserAuthenticateModel(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    user: str
    session: str


class UserInfo(BaseModel):
    username: str
    accounts: list


class UserController(Controller):
    path = "/users"

    @post("/create", status_code=201)
    async def create_user(
        self, app_state: AppState, data: UserAuthenticateModel
    ) -> LoginResponse:
        if len(User.load(app_state.database, query={"username": data.username})) != 0:
            raise ApplicationException(code=400, error_name="err.account_creation")
        new_user = User.create(app_state.database, data.username, data.password)
        session: Session = new_user.login()
        return LoginResponse(user=new_user.id, session=session.id)

    @post("/login", status_code=200)
    async def login(
        self, app_state: AppState, data: UserAuthenticateModel
    ) -> LoginResponse:
        try:
            result: User = User.load(app_state.database, query={"username": data.username})[0]
        except IndexError:
            raise LoginException()

        if sha256(data.password.encode("utf-8")).hexdigest() == result.password_hash:
            session: Session = result.login()
            return LoginResponse(user=result.id, session=session.id)
        else:
            raise LoginException()

    @get("", guards=[is_logged_in], dependencies={"user": Provide(dep_user)})
    async def user_info(self, user: User) -> UserInfo:
        return UserInfo(
            username=user.username,
            accounts=[
                {
                    "active": bool(i["token"]),
                    "username": i["username"],
                    "username": i["username"],
                    "avatar": i["avatar"],
                }
                for i in user.accounts
            ],
        )

    @delete("", guards=[is_logged_in], dependencies={"session": Provide(dep_session)})
    async def logout(self, session: Session) -> None:
        session.collection.delete_one({"id": session.id})

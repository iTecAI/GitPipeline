from .base import BaseORM
from pymongo.database import Database
from hashlib import sha256
import time
from typing import TypedDict, Union

class GithubAccount(TypedDict):
    token: Union[str, None]
    username: str
    avatar: str
    id: int


class User(BaseORM):
    TYPE = "user"
    COLLECTION = "users"

    def __init__(self, id: str, db, username: str, password_hash: str, accounts: list[GithubAccount] = [], **kwargs):
        super().__init__(id, db, **kwargs)
        self.username = username
        self.password_hash = password_hash
        self.accounts = accounts
    
    @classmethod
    def create(cls, db: Database, username: str, password: str) -> "User":
        created = User(cls.generate_uuid(), db, username, sha256(password.encode("utf-8")).hexdigest())
        created.save()
        return created

    def login(self) -> "Session":
        return Session.create(self.db, self)

class Session(BaseORM):
    TYPE = "session"
    COLLECTION = "sessions"
    SESSION_TIMEOUT = 86400

    def __init__(self, id: str, db: Database, last_interaction: float, user: str, **kwargs):
        super().__init__(id, db, **kwargs)
        self.last_interaction = last_interaction
        self.user = user
    
    def update(self):
        self.last_interaction = time.time()
    
    @classmethod
    def create(cls, db: Database, user: User):
        created = Session(cls.generate_uuid(), db, time.time(), user.id)
        created.save()
        return created

    @property
    def User(self) -> User:
        try:
            return User.load(self.db, id=self.user)
        except:
            raise KeyError(f"User with ID {self.user} not found.")


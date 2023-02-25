from .base import BaseORM
from pymongo.database import Database
from hashlib import sha256
import time

class User(BaseORM):
    TYPE = "user"
    COLLECTION = "users"

    def __init__(self, id: str, db, email: str, password_hash: str, **kwargs):
        super().__init__(id, db, **kwargs)
        self.email = email
        self.password_hash = password_hash
    
    @classmethod
    def create(cls, db: Database, email: str, password: str) -> "User":
        created = User(cls.generate_uuid(), db, email, sha256(password.encode("utf-8")).hexdigest())
        created.save()
        return created

    def login(self) -> "Session":
        return Session.create(self.db, self)

class Session(BaseORM):
    TYPE = "session"
    COLLECTION = "sessions"

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

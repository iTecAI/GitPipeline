from pymongo.database import Database
from pymongo.collection import Collection
from pymongo import MongoClient
from starlite.plugins import PluginProtocol
from starlite import Starlite, State
from typing import Any, Awaitable, Dict, Type, Union
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus
from pydantic import BaseModel
import uuid


class BaseORM:
    TYPE = None
    COLLECTION = None
    EXCLUDE = []
    _orms: dict[str, "BaseORM"] = {}

    def __init__(self, id: str, db: Database, **kwargs):
        if not self.TYPE:
            raise NotImplementedError("ORM must have a defined type")
        if not self.COLLECTION:
            raise NotImplementedError("ORM must have an associated DB collection")
        self.id: str = id
        self.db: Database = db
        self.collection: Collection = db[self.COLLECTION]

    def __init_subclass__(cls) -> None:
        if not cls.TYPE in cls._orms.keys():
            cls._orms[cls.TYPE] = cls

    def to_dict(self) -> dict:
        result = {
            k: v
            for k, v in self.__dict__.items()
            if not k in self.EXCLUDE and not k in ["db", "collection"]
        }
        result["_type"] = self.TYPE
        return result

    @classmethod
    def from_dict(cls, data: dict, db: Database):
        _id = data.pop("id")
        try:
            _type = data.pop("_type")
        except:
            _type = cls.TYPE
        construct = cls._orms[_type]
        return construct(_id, db, **data)

    def save(self):
        self.collection.replace_one({"id": self.id}, self.to_dict(), upsert=True)

    @classmethod
    def load(cls, db: Database, id: str = None, query: dict = None):
        if not id and not query:
            raise ValueError("id or query arguments must be specified")

        if id:
            result = db[cls.COLLECTION].find_one({"id": id})
            if result == None:
                raise KeyError(f"Object with id {id} in {cls.COLLECTION} not found.")
            return cls.from_dict(result, db)
        else:
            result = [i for i in db[cls.COLLECTION].find(query)]
            return [cls.from_dict(i, db) for i in result]
    
    @classmethod
    def create(cls, db: Database, **kwargs):
        raise NotImplementedError("create() is not implemented for this ORM")

    @staticmethod
    def generate_uuid() -> str:
        return uuid.uuid4().hex


class ORMPlugin(PluginProtocol[BaseORM]):
    def orm_start(self, state: State):
        client = MongoClient(
            f"mongodb://{self.env['db']['host']}/?ssl={'true' if self.env['db']['ssl'] else 'false'}",
            username=self.env["db"]["user"],
            password=self.env["db"]["password"]
        )
        self.database = client[self.env['db']['database']]
        state.database = self.database

    def on_app_init(self, app: Starlite) -> None:
        load_dotenv()
        self.env = {
            "db": {
                "host": os.getenv("DB_HOST", "localhost:27017"),
                "database": os.getenv("DB_DATABASE", "gitline"),
                "user": os.getenv("DB_USER", "root"),
                "password": os.getenv("DB_PASS", "root"),
                "ssl": os.getenv("DB_SSL", "no").lower() == "yes",
            }
        }
        self.database = None
        app.on_startup.append(self.orm_start)

    @staticmethod
    def is_plugin_supported_type(value: Any) -> bool:
        return isinstance(value, BaseORM)

    def to_dict(
        self, model_instance: BaseORM
    ) -> Union[Dict[str, Any], Awaitable[Dict[str, Any]]]:
        return model_instance.to_dict()

    def from_dict(self, model_class: Type[BaseORM], **kwargs: Any) -> BaseORM:
        if not self.database:
            raise RuntimeError("Database not initialized")
        return model_class.from_dict(kwargs, self.database)

    def to_pydantic_model_class(self, model_class: Type[BaseORM], **kwargs: Any) -> Type[BaseModel]:
        return BaseModel(**kwargs, _type=model_class.TYPE)
    
    def from_pydantic_model_instance(self, model_class: Type[BaseORM], pydantic_model_instance: "BaseModel") -> BaseORM:
        return model_class.from_dict(pydantic_model_instance.dict())

from starlite import Starlite, Provide, get
from starlite.status_codes import *
from models import *
from util import exception_handler, get_app_state
import time
import logging
import coloredlogs
import os
from controllers import *
os.environ["COLOREDLOGS_LOG_FORMAT"] = "%(asctime)s : %(levelname)s : %(filename)s:%(funcName)s @ %(lineno)dL > %(message)s"

coloredlogs.install(level="DEBUG")

@get("/")
async def root() -> dict:
    return {
        "time": time.ctime()
    }

def init():
    logging.info("Server online...")

app = Starlite(
    route_handlers=[root, UserController],
    plugins=[ORMPlugin()],
    exception_handlers={Exception: exception_handler},
    dependencies={"app_state": Provide(get_app_state)},
    on_startup=[init]
)

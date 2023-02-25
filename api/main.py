from starlite import Starlite, Provide, get
from starlite.status_codes import *
from models import *
from util import exception_handler, get_app_state
import time
import logging

logging.basicConfig(level="DEBUG", format="%(asctime)s : %(levelname)s : %(filename)s:%(funcName)s @ %(lineno)dL > %(message)s")

@get("/")
async def root() -> dict:
    return {
        "time": time.ctime()
    }

def init():
    logging.info("Server online...")

app = Starlite(
    route_handlers=[root],
    plugins=[ORMPlugin()],
    exception_handlers={Exception: exception_handler},
    dependencies={"app_state": Provide(get_app_state)},
    on_startup=[init]
)

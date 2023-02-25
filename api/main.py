from starlite import Starlite, Provide, get, State
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
async def root(state: State) -> dict:
    return {
        "time": time.ctime()
    }

def init(state: State):
    logging.info("Server online...")
    state.gh_client = os.environ.get("CLIENT_ID")
    state.gh_secret = os.environ.get("CLIENT_SECRET")
    state.dev_mode = os.environ.get("DEV", "false").lower() == "true"
    state.gh_redirect = os.environ.get("REDIRECT")

app = Starlite(
    route_handlers=[root, UserController, GithubController],
    plugins=[ORMPlugin()],
    exception_handlers={Exception: exception_handler},
    dependencies={"app_state": Provide(get_app_state)},
    on_startup=[init]
)

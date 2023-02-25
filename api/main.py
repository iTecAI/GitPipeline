from starlite import Starlite, Provide
from starlite.status_codes import *
from models import *
from util import exception_handler, get_app_state

app = Starlite(
    route_handlers=[],
    plugins=[ORMPlugin()],
    exception_handlers={Exception: exception_handler},
    dependencies={"app_state": Provide(get_app_state)},
)

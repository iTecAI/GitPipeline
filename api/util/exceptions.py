from starlite import Request, Response
from starlite.status_codes import *
from starlite.exceptions import HTTPException
import logging
from ._types import ErrorResponse
import traceback

def exception_handler(r: Request, exc: Exception) -> Response:
    status_code = getattr(exc, "status_code", HTTP_500_INTERNAL_SERVER_ERROR)
    detail = getattr(exc, "detail", "err.generic")
    if status_code == HTTP_500_INTERNAL_SERVER_ERROR:
        logging.exception("Server error encountered:\n")
    else:
        logging.warning(f"Error {status_code} from {r.client.host}:{r.client.port} @ {r.method} {r.url} : {detail}")

    return Response(
        content=ErrorResponse(detail=detail, error="".join(traceback.format_exception(exc))),
        status_code=status_code,
    )

class ApplicationException(HTTPException):
    def __init__(self, code: int=HTTP_500_INTERNAL_SERVER_ERROR, error_name: str="err.generic"):
        super().__init__(status_code=code, detail=error_name)

class AuthenticationException(ApplicationException):
    def __init__(self):
        super().__init__(code=HTTP_401_UNAUTHORIZED, error_name="err.auth")

class LoginException(ApplicationException):
    def __init__(self):
        super().__init__(code=HTTP_404_NOT_FOUND, error_name="err.login")

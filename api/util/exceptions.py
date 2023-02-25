from starlite import Request, Response
from starlite.status_codes import *
import logging
from ._types import ErrorResponse
import traceback

def exception_handler(r: Request, exc: Exception) -> Response:
    status_code = getattr(exc, "status_code", HTTP_500_INTERNAL_SERVER_ERROR)
    detail = getattr(exc, "detail", "")
    if status_code == HTTP_500_INTERNAL_SERVER_ERROR:
        logging.exception("Server error encountered:\n")
    else:
        logging.warning(f"Error {status_code} from {r.client.host}:{r.client.port} @ {r.method} {r.url} : {detail}")

    return Response(
        content=ErrorResponse(detail=detail, error="".join(traceback.format_exception(exc))),
        status_code=status_code,
    )
from starlite import Request, Response
from starlite.status_codes import *
import logging
from ._types import ErrorResponse
import traceback

def exception_handler(r: Request, exc: Exception) -> Response:
    status_code = getattr(exc, "status_code", HTTP_500_INTERNAL_SERVER_ERROR)
    detail = getattr(exc, "detail", "")
    logging.exception("ERR")

    return Response(
        content=ErrorResponse(detail=detail, error="".join(traceback.format_exception(exc))),
        status_code=status_code,
    )
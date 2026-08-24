from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.exceptions.base import AppError
from app.core.logging import get_logger

logger = get_logger("exception_handler")


def error_envelope(code: str, message: str) -> dict:
    return {"data": None, "error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError):
        logger.warning(
            "app_error",
            extra={"extra_fields": {"code": exc.code, "path": request.url.path}},
        )
        return JSONResponse(status_code=exc.status_code, content=error_envelope(exc.code, exc.message))

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException):
        code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
        return JSONResponse(
            status_code=exc.status_code,
            content=error_envelope(code, str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=error_envelope("VALIDATION_ERROR", "Request validation failed."),
        )

    from sqlalchemy.exc import OperationalError

    @app.exception_handler(OperationalError)
    async def handle_db_operational_error(request: Request, exc: OperationalError):
        logger.error(
            "database_connection_refused",
            exc_info=exc,
            extra={"extra_fields": {"path": request.url.path}},
        )
        return JSONResponse(
            status_code=503,
            content=error_envelope(
                "DATABASE_UNAVAILABLE",
                "Database service unavailable. Please check database connection and host service."
            ),
        )

    @app.exception_handler(Exception)
    async def handle_unhandled(request: Request, exc: Exception):
        logger.error(
            "unhandled_exception",
            exc_info=exc,
            extra={"extra_fields": {"path": request.url.path}},
        )
        return JSONResponse(
            status_code=500,
            content=error_envelope("INTERNAL_ERROR", "An unexpected error occurred."),
        )


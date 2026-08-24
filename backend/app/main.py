from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.exceptions.handlers import register_exception_handlers
from app.api.v1.router import api_router

settings = get_settings()
configure_logging(settings.LOG_LEVEL)
logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", extra={"extra_fields": {"env": settings.ENV}})
    try:
        from scripts.seed_demo_users import seed_demo_users
        seed_demo_users()
    except Exception as e:
        logger.warning(f"Could not seed demo users on startup: {e}")
    yield
    logger.info("shutdown", extra={"extra_fields": {"env": settings.ENV}})



def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        docs_url="/docs" if settings.ENV != "production" else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()

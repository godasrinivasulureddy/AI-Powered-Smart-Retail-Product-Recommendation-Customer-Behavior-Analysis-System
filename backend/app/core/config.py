from pathlib import Path
from functools import lru_cache
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"  # backend/.env, absolute — works regardless of CWD


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "smart-retail-ai"
    ENV: str = Field(default="development")  # development | staging | production
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "sqlite:///./dev.db"

    JWT_SECRET_KEY: str = Field(default="CHANGE_ME_IN_ENV")
    # TODO(Phase 3): add a model_validator that raises if ENV=="production"
    # and JWT_SECRET_KEY == "CHANGE_ME_IN_ENV" — fail fast instead of booting insecure.
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    LOG_LEVEL: str = "INFO"

    @model_validator(mode="after")
    def _fail_fast_on_insecure_secret(self) -> "Settings":
        if self.ENV == "production" and self.JWT_SECRET_KEY == "CHANGE_ME_IN_ENV":
            raise ValueError("JWT_SECRET_KEY must be set to a real secret in production.")
        if self.DATABASE_URL.startswith("sqlite:///./"):
            db_name = self.DATABASE_URL.replace("sqlite:///./", "")
            db_file = Path(__file__).resolve().parents[2] / db_name
            self.DATABASE_URL = f"sqlite:///{db_file.as_posix()}"
        return self



@lru_cache
def get_settings() -> Settings:
    return Settings()

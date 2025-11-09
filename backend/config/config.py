# config.py
from typing import List, Set, Optional
from pydantic import BaseSettings, AnyHttpUrl, Field, validator
from datetime import timedelta
import os

class AppSettings(BaseSettings):
    """
    Application settings (replace Flask Config class).
    Reads from environment variables automatically (UPPER_SNAKE_CASE).
    """

    # Core
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for sessions / signing"
    )
    DEBUG: bool = Field(default=True, description="Enable debug mode")

    # File upload configuration
    MAX_CONTENT_LENGTH: int = Field(default=50 * 1024 * 1024, description="Max file upload size (bytes)")
    UPLOAD_FOLDER: str = Field(default="uploads", description="Upload directory")
    ALLOWED_EXTENSIONS: Set[str] = Field(default={"csv", "xlsx", "xls"}, description="Allowed file extensions")

    # Data processing configuration
    MAX_ROWS: int = Field(default=100_000, description="Maximum rows to process")
    MAX_COLUMNS: int = Field(default=1_000, description="Maximum columns to process")

    # Dataset storage settings
    DATASET_EXPIRY: timedelta = Field(default=timedelta(hours=24), description="Expiry for stored datasets")
    CLEANUP_INTERVAL: timedelta = Field(default=timedelta(hours=1), description="Cleanup interval")

    # API request throttling
    THROTTLE_INTERVAL: float = Field(default=1.0, description="Minimum seconds between requests")

    # Log settings
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # CORS configuration
    CORS_ORIGINS: List[AnyHttpUrl] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    # Ensure older-style env var with comma-separated values still works (optional)
    @validator("CORS_ORIGINS", pre=True)
    def _parse_cors_origins(cls, v):
        if isinstance(v, str):
            # allow comma-separated env var like "http://a, http://b"
            return [u.strip() for u in v.split(",") if u.strip()]
        return v


# Helper factory for environment-specific configs like development/production
def get_settings(env: Optional[str] = None) -> AppSettings:
    """
    Instantiate settings. Optionally pass env = 'production' / 'development' to
    override specific runtime defaults if you want.
    """
    s = AppSettings()
    if env is None:
        env = os.environ.get("APP_ENV", "development").lower()

    if env == "production":
        # Override a couple of sensible production defaults (but prefer env vars)
        s.DEBUG = False
        s.LOG_LEVEL = s.LOG_LEVEL or "WARNING"
        if os.environ.get("SECRET_KEY"):
            s.SECRET_KEY = os.environ["SECRET_KEY"]
    elif env == "development":
        s.DEBUG = True
        s.LOG_LEVEL = s.LOG_LEVEL or "INFO"
    return s


# Single global settings object you can import elsewhere in your app:
settings = get_settings()  # will read APP_ENV or env defaults

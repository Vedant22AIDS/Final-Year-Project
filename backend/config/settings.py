# setting.py
from typing import List, Optional
from pydantic import BaseSettings, AnyHttpUrl, Field
from datetime import timedelta
import os

class BaseConfig(BaseSettings):
    """
    Base configuration converted from the Flask-style Setting class.
    """
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production")
    MAX_CONTENT_LENGTH: int = Field(default=50 * 1024 * 1024)
    CORS_ORIGINS: List[AnyHttpUrl] = Field(default=["http://localhost:3000", "http://127.0.0.1:3000"])
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    class Config:
        env_file = ".env"
        case_sensitive = False

class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"

class ProductionConfig(BaseConfig):
    DEBUG: bool = False
    LOG_LEVEL: str = "WARNING"

class TestingConfig(BaseConfig):
    TESTING: bool = True
    DEBUG: bool = True

# mapping similar to original "config" dict
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig
}

# Convenience to instantiate the desired environment config
def get_config(env: Optional[str] = None) -> BaseConfig:
    env = env or os.environ.get("APP_ENV", "development")
    env = env.lower()
    cls = config.get(env, config["default"])
    return cls()

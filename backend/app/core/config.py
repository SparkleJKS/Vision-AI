from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VisionAI Backend"
    environment: str = "local"
    log_level: str = "INFO"
    cors_allow_origins: str = "*"
    model_version: str = "yolov8n-0.1"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        if self.cors_allow_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_allow_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    api_auth_token: str | None = None
    cors_origins: str = "http://localhost:3000"

    gemini_api_key: str | None = None
    grok_api_key: str | None = None

    gemini_model: str = "gemini-2.5-flash"
    grok_model: str = "grok-4"
    enable_grok_fallback: bool = True

    default_language: str = "hinglish"
    max_image_mb: int = 7
    max_json_mb: int = 2
    rate_limit_per_minute: int = 60

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

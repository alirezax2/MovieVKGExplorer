"""Configuration settings for the Movie Virtual Knowledge Graph (VKG) application.

Loads environment variables with robust defaults and aliases.
"""

from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database connection parameters
    postgres_host: str = Field(default="127.0.0.1", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    postgres_db: str = Field(default="movies_db", alias="POSTGRES_DB")
    postgres_user: str = Field(default="ontop_ro", alias="POSTGRES_USER")
    postgres_password: str = Field(default="dev_ontop_ro_secret_password_2026", alias="POSTGRES_PASSWORD")

    # Ontop VKG endpoint
    ontop_port: int = Field(default=8080, alias="ONTOP_PORT")
    ontop_endpoint_url: str = Field(default="http://localhost:8080/sparql", alias="ONTOP_ENDPOINT_URL")
    vkg_base_iri: str = Field(default="https://example.org/movie-vkg/", alias="VKG_BASE_IRI")

    # OmniRoute LLM settings (supports both standard and user-specified ALPHIGMA_* names)
    omniroute_base_url: str = Field(default="https://omniroute.alphigma.com/v1")
    omniroute_api_key: str = Field(default="sk-cba32ec1d23c3c6a-fcb67c-129aaa10")
    omniroute_model: str = Field(default="no-think/antigravity/claude-sonnet-4-6", alias="OMNIROUTE_MODEL")
    llm_timeout_seconds: int = Field(default=45, alias="LLM_TIMEOUT_SECONDS")

    # API Security and runtime controls
    api_key: str = Field(default="dev_movie_vkg_secret_api_key_2026", alias="API_KEY")
    fastapi_host: str = Field(default="127.0.0.1", alias="FASTAPI_HOST")
    fastapi_port: int = Field(default=8000, alias="FASTAPI_PORT")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
    )
    max_sparql_results: int = Field(default=500, alias="MAX_SPARQL_RESULTS")
    query_timeout_seconds: int = Field(default=30, alias="QUERY_TIMEOUT_SECONDS")
    rate_limit_per_minute: int = Field(default=60, alias="RATE_LIMIT_PER_MINUTE")

    @property
    def parsed_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def __init__(self, **values):
        # Allow fallback from ALPHIGMA_OMNIROUTE_* environment variables
        import os

        if "omniroute_base_url" not in values:
            if "ALPHIGMA_OMNIROUTE_url" in os.environ:
                values["omniroute_base_url"] = os.environ["ALPHIGMA_OMNIROUTE_url"]
            elif "OMNIROUTE_BASE_URL" in os.environ:
                values["omniroute_base_url"] = os.environ["OMNIROUTE_BASE_URL"]

        if "omniroute_api_key" not in values:
            if "ALPHIGMA_OMNIROUTE_APIKEY" in os.environ:
                values["omniroute_api_key"] = os.environ["ALPHIGMA_OMNIROUTE_APIKEY"]
            elif "OMNIROUTE_API_KEY" in os.environ:
                values["omniroute_api_key"] = os.environ["OMNIROUTE_API_KEY"]

        super().__init__(**values)

    @property
    def database_url(self) -> str:
        """Construct PostgreSQL SQLAlchemy connection URL using psycopg driver."""
        return f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def safe_database_url(self) -> str:
        """Return safe database URL with credentials masked for logging and diagnostics."""
        return f"postgresql+psycopg://{self.postgres_user}:***@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"


settings = Settings()

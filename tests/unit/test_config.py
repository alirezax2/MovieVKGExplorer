"""Unit tests for configuration and environment handling."""

from app.config import Settings


def test_config_defaults():
    settings = Settings(
        POSTGRES_DB="test_db",
        POSTGRES_USER="test_ro",
        POSTGRES_PASSWORD="secret_password",
    )
    assert settings.postgres_db == "test_db"
    assert settings.postgres_port == 5432
    assert "postgresql+psycopg://" in settings.database_url
    assert "secret_password" not in settings.safe_database_url
    assert "***" in settings.safe_database_url


def test_cors_origins_parsing():
    settings = Settings(
        CORS_ORIGINS="http://localhost:3000, http://example.com ,http://127.0.0.1:5173",
    )
    origins = settings.parsed_cors_origins
    assert len(origins) == 3
    assert "http://localhost:3000" in origins
    assert "http://example.com" in origins
    assert "http://127.0.0.1:5173" in origins


def test_alphigma_omniroute_alias_fallback(monkeypatch):
    monkeypatch.setenv("ALPHIGMA_OMNIROUTE_url", "https://custom.omniroute.com/v1")
    monkeypatch.setenv("ALPHIGMA_OMNIROUTE_APIKEY", "custom_key_123")

    # Pass None or empty to test fallback
    s = Settings()
    assert "custom.omniroute.com" in s.omniroute_base_url
    assert s.omniroute_api_key == "custom_key_123"

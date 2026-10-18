"""Pytest configuration and common fixtures."""

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture
def client():
    """FastAPI test client fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers():
    """Valid authentication headers for API tests."""
    return {"X-API-Key": settings.api_key}


@pytest.fixture
def invalid_auth_headers():
    """Invalid authentication headers."""
    return {"X-API-Key": "invalid_wrong_key"}

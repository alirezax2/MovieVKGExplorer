"""Unit tests for API key authentication."""

from app.config import settings


def test_auth_valid_header(client):
    response = client.get("/schema", headers={"X-API-Key": settings.api_key})
    assert response.status_code == 200


def test_auth_valid_bearer_token(client):
    response = client.get("/schema", headers={"Authorization": f"Bearer {settings.api_key}"})
    assert response.status_code == 200


def test_auth_missing_key_rejected(client):
    response = client.get("/schema")
    assert response.status_code == 401
    assert "Unauthorized" in response.json().get("detail", "")


def test_auth_invalid_key_rejected(client):
    response = client.get("/schema", headers={"X-API-Key": "wrong_key"})
    assert response.status_code == 401


def test_public_health_and_ready_accessible_without_auth(client):
    # Health and Ready should be accessible without credentials
    h_resp = client.get("/health")
    assert h_resp.status_code == 200
    assert "status" in h_resp.json()

    r_resp = client.get("/ready")
    assert r_resp.status_code == 200
    assert "ready" in r_resp.json()

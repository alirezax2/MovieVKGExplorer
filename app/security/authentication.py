"""API Key Authentication Module.

Secures protected endpoints via X-API-Key header or Authorization: Bearer header.
"""

from typing import Optional

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


async def verify_api_key(
    api_key_hdr: Optional[str] = Security(api_key_header),
    auth_bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> str:
    """Verify incoming request credentials against configured system API key."""
    provided_key = None
    if api_key_hdr:
        provided_key = api_key_hdr.strip()
    elif auth_bearer and auth_bearer.credentials:
        provided_key = auth_bearer.credentials.strip()

    if not provided_key or provided_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing API Key. Provide a valid 'X-API-Key' header or Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return provided_key

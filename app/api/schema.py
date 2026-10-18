"""Schema metadata endpoint."""

import json
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.security.authentication import verify_api_key
from app.services.schema_service import SchemaService

router = APIRouter(tags=["Schema Discovery"])


@router.get("/schema", response_model=Dict[str, Any], summary="Get Safe Schema & Mapping Report")
async def get_schema(api_key: str = Depends(verify_api_key)):
    """Return discovered database schema metadata and mapping eligibility report."""
    schema_path = Path("artifacts/schema.json")
    if schema_path.exists():
        with open(schema_path, "r", encoding="utf-8") as f:
            return json.load(f)

    # Fallback to dynamic inspection
    service = SchemaService()
    return service.inspect_schema(include_row_counts=False)

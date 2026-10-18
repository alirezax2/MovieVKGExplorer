"""Health and readiness check endpoints."""

from fastapi import APIRouter

from app.config import settings
from app.models.responses import HealthResponse, ReadyResponse
from app.services.llm_service import LLMService
from app.services.schema_service import SchemaService
from app.services.sparql_service import SPARQLService

router = APIRouter(tags=["System Health"])


@router.get("/health", response_model=HealthResponse, summary="Application Health Check")
async def get_health():
    """Verify application liveness and basic service status."""
    db_ok = False
    try:
        schema_service = SchemaService()
        res = schema_service.test_connection()
        db_ok = res.get("connected", False)
    except Exception:
        db_ok = False

    sparql_service = SPARQLService()
    ontop_ok = await sparql_service.check_health()

    status = "healthy" if (db_ok and ontop_ok) else "degraded"

    return HealthResponse(
        status=status,
        database_connected=db_ok,
        ontop_connected=ontop_ok,
        environment=settings.environment,
        version="1.0.0",
    )


@router.get("/ready", response_model=ReadyResponse, summary="Application Readiness Check")
async def get_readiness():
    """Verify that all core dependencies (PostgreSQL, Ontop, OmniRoute) are reachable without disclosing credentials."""
    checks = {}

    # Check 1: PostgreSQL
    try:
        schema_service = SchemaService()
        res = schema_service.test_connection()
        checks["postgresql"] = res.get("connected", False)
    except Exception:
        checks["postgresql"] = False

    # Check 2: Ontop VKG
    try:
        sparql_service = SPARQLService()
        checks["ontop_vkg"] = await sparql_service.check_health()
    except Exception:
        checks["ontop_vkg"] = False

    # Check 3: OmniRoute LLM gateway
    try:
        llm_service = LLMService()
        checks["omniroute_llm"] = await llm_service.check_health()
    except Exception:
        checks["omniroute_llm"] = False

    ready = all(checks.values())
    return ReadyResponse(
        ready=ready,
        checks=checks,
        details={
            "database": "reachable" if checks["postgresql"] else "unreachable",
            "ontop": "reachable" if checks["ontop_vkg"] else "unreachable",
            "omniroute": "reachable" if checks["omniroute_llm"] else "unreachable",
        },
    )

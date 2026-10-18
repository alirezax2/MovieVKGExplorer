"""SPARQL Query Execution Endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.requests import QueryRequest
from app.models.responses import QueryResponse
from app.security.authentication import verify_api_key
from app.security.sparql_validator import SPARQLValidationError
from app.services.sparql_service import SPARQLExecutionError, SPARQLService

router = APIRouter(tags=["SPARQL Queries"])


@router.post("/query", response_model=QueryResponse, summary="Execute Read-Only SPARQL Query")
async def execute_sparql_query(
    request: QueryRequest,
    api_key: str = Depends(verify_api_key),
):
    """Execute a validated, read-only SPARQL query against the PostgreSQL Virtual Knowledge Graph.

    Rejects updates, federated SERVICE queries, unapproved dataset access, and enforces system result limits.
    """
    service = SPARQLService()
    try:
        result = await service.execute_query(
            raw_query=request.query,
            requested_limit=request.limit,
        )
        return QueryResponse(**result)
    except SPARQLValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": e.code, "message": e.message},
        )
    except SPARQLExecutionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": "QUERY_EXECUTION_FAILED", "message": e.message},
        )

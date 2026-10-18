"""Natural language question-answering endpoint with OmniRoute LLM integration."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.models.requests import AskRequest
from app.models.responses import AskResponse
from app.security.authentication import verify_api_key
from app.security.sparql_validator import SPARQLValidationError
from app.services.llm_service import LLMService, LLMServiceError
from app.services.sparql_service import SPARQLExecutionError, SPARQLService

router = APIRouter(tags=["AI Query Assistant"])


@router.post("/ask", response_model=AskResponse, summary="Ask Natural Language Question")
async def ask_question(
    request: AskRequest,
    api_key: str = Depends(verify_api_key),
):
    """Ask a natural language question about the movie database and taxonomy.

    Translates the question to SPARQL via OmniRoute, validates the query,
    executes it through Ontop, and synthesizes a grounded, factual answer.
    """
    llm_service = LLMService(model=request.model)
    sparql_service = SPARQLService()
    active_model = request.model or settings.omniroute_model

    # Step 1: Generate SPARQL using OmniRoute LLM
    try:
        gen_result = await llm_service.generate_sparql(request.question)
    except LLMServiceError as e:
        raise HTTPException(status_code=e.status_code, detail={"code": "LLM_ERROR", "message": e.message})

    sparql_query = gen_result.get("sparql", "").strip()
    explanation = gen_result.get("explanation", "").strip()

    # If the LLM determined the question cannot be answered with current ontology
    if not sparql_query:
        return AskResponse(
            question=request.question,
            generated_sparql="",
            explanation=explanation
            or "The available ontology does not contain enough information to answer this question.",
            row_count=0,
            results=[],
            execution_time_ms=0.0,
            model=active_model,
        )

    # Step 2: Validate and execute query against Ontop VKG
    try:
        query_result = await sparql_service.execute_query(sparql_query)
    except SPARQLValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "GENERATED_QUERY_INVALID",
                "message": f"LLM generated an invalid query: {e.message}",
                "sparql": sparql_query,
            },
        )
    except SPARQLExecutionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": "ONTOP_EXECUTION_FAILED", "message": e.message, "sparql": sparql_query},
        )

    # Step 3: Synthesize grounded explanation
    try:
        grounded_explanation = await llm_service.synthesize_answer(
            question=request.question,
            sparql_query=query_result["query"],
            results=query_result["results"],
        )
    except Exception:
        grounded_explanation = f"Found {query_result['row_count']} matching records."

    return AskResponse(
        question=request.question,
        generated_sparql=query_result["query"],
        explanation=grounded_explanation,
        row_count=query_result["row_count"],
        results=query_result["results"],
        execution_time_ms=query_result["execution_time_ms"],
        model=active_model,
    )


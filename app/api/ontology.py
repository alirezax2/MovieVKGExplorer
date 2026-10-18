"""Ontology representation and vocabulary endpoint."""

from fastapi import APIRouter, Depends

from app.config import settings
from app.models.responses import OntologyResponse
from app.security.authentication import verify_api_key
from app.services.ontology_service import OntologyService

router = APIRouter(tags=["Ontology"])


@router.get("/ontology", response_model=OntologyResponse, summary="Get Ontology Specification")
async def get_ontology(api_key: str = Depends(verify_api_key)):
    """Return the OWL/Turtle ontology vocabulary, classes, and properties."""
    service = OntologyService()
    return OntologyResponse(
        base_iri=settings.vkg_base_iri,
        ontology_ttl=service.get_raw_turtle(),
        classes=service.get_classes(),
        properties=service.get_properties(),
    )

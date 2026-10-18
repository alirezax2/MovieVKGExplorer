"""Pydantic response models."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    database_connected: bool
    ontop_connected: bool
    environment: str
    version: str = "1.0.0"


class ReadyResponse(BaseModel):
    ready: bool
    checks: Dict[str, bool]
    details: Optional[Dict[str, str]] = None


class QueryResponse(BaseModel):
    query: str
    columns: List[str]
    row_count: int
    results: List[Dict[str, Any]]
    execution_time_ms: float


class AskResponse(BaseModel):
    question: str
    generated_sparql: str
    explanation: str
    row_count: int
    results: List[Dict[str, Any]]
    execution_time_ms: float
    model: str


class OntologyClassInfo(BaseModel):
    iri: str
    label: str
    comment: Optional[str] = None


class OntologyPropertyInfo(BaseModel):
    iri: str
    label: str
    property_type: str  # "ObjectProperty" or "DatatypeProperty"
    domain: Optional[str] = None
    range: Optional[str] = None
    comment: Optional[str] = None


class OntologyResponse(BaseModel):
    base_iri: str
    ontology_ttl: str
    classes: List[OntologyClassInfo]
    properties: List[OntologyPropertyInfo]


class ModelInfo(BaseModel):
    id: str
    name: str
    badge: str
    category: str
    best_use: str
    description: str


class AvailableModelsResponse(BaseModel):
    default: str
    models: List[ModelInfo]


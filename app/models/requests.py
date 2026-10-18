"""Pydantic request models."""

from typing import Optional

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(
        ...,
        description="Read-only SPARQL SELECT query",
        examples=[
            "PREFIX : <https://example.org/movie-vkg/> SELECT ?m ?title ?rating WHERE { ?m a :Movie ; :title ?title ; :rating ?rating } LIMIT 10"
        ],
    )
    limit: Optional[int] = Field(
        default=None,
        description="Optional maximum number of results to return (capped by system limit)",
        ge=1,
        le=1000,
    )


class AskRequest(BaseModel):
    question: str = Field(
        ...,
        description="Natural language question about movies, taxonomy classes, subclasses, or metadata",
        min_length=3,
        max_length=500,
        examples=["What are the top 5 highest rated movies in the database?"],
    )
    model: Optional[str] = Field(
        default=None,
        description="Optional OmniRoute model identifier or smart routing alias (e.g. 'claude-sonnet', 'auto', 'auto/smart', 'auto/coding', 'auto/fast', 'auto/cheap', 'auto/offline')",
        examples=["auto/smart", "claude-sonnet"],
    )


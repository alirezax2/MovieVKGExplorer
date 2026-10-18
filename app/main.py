"""Movie Virtual Knowledge Graph FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.ask import router as ask_router
from app.api.health import router as health_router
from app.api.ontology import router as ontology_router
from app.api.query import router as query_router
from app.api.schema import router as schema_router
from app.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("movie_vkg")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Movie Virtual Knowledge Graph service...")
    logger.info(f"Target Ontop Endpoint: {settings.ontop_endpoint_url}")
    logger.info(f"Connected Database: {settings.safe_database_url}")
    logger.info(f"OmniRoute Gateway: {settings.omniroute_base_url} (Model: {settings.omniroute_model})")
    yield
    logger.info("Shutting down Movie Virtual Knowledge Graph service.")


app = FastAPI(
    title="Movie Virtual Knowledge Graph & AI Query Interface",
    description=(
        "Production-grade Virtual Knowledge Graph service over PostgreSQL using Ontop, "
        "providing constrained SPARQL execution and OmniRoute LLM natural language queries."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for React + Bun frontend and local clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global unhandled exception handler to protect internal secrets and connection strings
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred while processing your semantic query request.",
        },
    )


# Include API Routers
app.include_router(health_router)
app.include_router(schema_router)
app.include_router(ontology_router)
app.include_router(query_router)
app.include_router(ask_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=(settings.environment == "development"),
    )

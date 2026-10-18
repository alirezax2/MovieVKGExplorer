"""Available OmniRoute models and smart routing aliases endpoint."""

from fastapi import APIRouter

from app.models.responses import AvailableModelsResponse, ModelInfo

router = APIRouter(tags=["AI Query Assistant"])

AVAILABLE_MODELS = [
    ModelInfo(
        id="claude-sonnet",
        name="OmniRoute: claude-sonnet",
        badge="Claude 3.5",
        category="Direct Model",
        best_use="Default direct high-precision model pipeline",
        description="Dedicated Claude 3.5 Sonnet route on OmniRoute",
    ),
    ModelInfo(
        id="auto",
        name="auto",
        badge="Balanced",
        category="Smart Routing",
        best_use="General-purpose, balanced model selection",
        description="General-purpose, balanced model selection",
    ),
    ModelInfo(
        id="auto/smart",
        name="auto/smart",
        badge="Smart",
        category="Smart Routing",
        best_use="Complex quantitative research and difficult reasoning",
        description="Complex quantitative research and difficult reasoning",
    ),
    ModelInfo(
        id="auto/coding",
        name="auto/coding",
        badge="Coding",
        category="Smart Routing",
        best_use="Writing Python, debugging, and code generation",
        description="Writing Python, debugging, and code generation",
    ),
    ModelInfo(
        id="auto/fast",
        name="auto/fast",
        badge="Fast",
        category="Smart Routing",
        best_use="Interactive tools and low-latency tasks",
        description="Interactive tools and low-latency tasks",
    ),
    ModelInfo(
        id="auto/cheap",
        name="auto/cheap",
        badge="Cheap",
        category="Smart Routing",
        best_use="Bulk ingestion, simple summaries, and routine processing",
        description="Bulk ingestion, simple summaries, and routine processing",
    ),
    ModelInfo(
        id="auto/offline",
        name="auto/offline",
        badge="Offline",
        category="Smart Routing",
        best_use="Local model providers, where supported",
        description="Local model providers, where supported",
    ),
]


@router.get("/models", response_model=AvailableModelsResponse, summary="List Available OmniRoute Models")
async def get_available_models():
    """Retrieve available OmniRoute models and Alphigma smart routing aliases."""
    return AvailableModelsResponse(
        default="claude-sonnet",
        models=AVAILABLE_MODELS,
    )

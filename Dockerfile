# ==============================================================================
# Dockerfile for Movie Virtual Knowledge Graph (FastAPI Service)
# ==============================================================================
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

# Install official uv binary
COPY --from=ghcr.io/astral-sh/uv:0.11.28 /uv /uvx /bin/

# Copy dependency specifications
COPY pyproject.toml uv.lock ./

# Install production dependencies reproducibly
RUN uv sync --frozen --no-dev --no-install-project

# ------------------------------------------------------------------------------
# Final Runtime Container Stage
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy virtualenv from builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy application source, configuration, metadata, and ontology
COPY app/ /app/app/
COPY scripts/ /app/scripts/
COPY ontop/ /app/ontop/
COPY artifacts/ /app/artifacts/
COPY pyproject.toml /app/

EXPOSE 8025

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8025/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8025"]

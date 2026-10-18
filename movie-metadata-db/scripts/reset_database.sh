#!/usr/bin/env bash
# ==============================================================================
# reset_database.sh
# Hard Reset and Reseed Script for Movie Metadata Database Environment
# ==============================================================================
# CAUTION:
# This script will tear down all Docker containers AND permanently remove
# the named Docker volumes (postgres_data and metabase_data).
# ALL PERSISTED DATA WILL BE LOST.
# The environment will then be recreated and automatically reseeded with 1,000 movies.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"

cd "${PROJECT_ROOT}"

echo "========================================================================"
echo "                   DATABASE RESET & RESEED SCRIPT                       "
echo "========================================================================"
echo " WARNING: You are about to DESTROY and REBUILD the database environment!"
echo " - The PostgreSQL volume (movie_metadata_postgres_data) will be DELETED."
echo " - The Metabase volume (movie_metadata_metabase_data) will be DELETED."
echo " - All custom Metabase cards, questions, and dashboards will be ERASED."
echo " - The database will be rebuilt and reseeded with 1,000 fresh records."
echo "========================================================================"

# Check for non-interactive flag -f or --force
FORCE=false
for arg in "$@"; do
    if [ "$arg" = "-f" ] || [ "$arg" = "--force" ]; then
        FORCE=true
    fi
done

if [ "$FORCE" = false ]; then
    read -r -p "Are you absolutely sure you want to proceed? [y/N]: " confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        echo "Reset aborted by user."
        exit 0
    fi
fi

echo ""
echo ">>> Step 1: Stopping containers and removing Docker volumes..."
docker compose down -v --remove-orphans

echo ""
echo ">>> Step 2: Starting containers with clean storage..."
docker compose up -d

echo ""
echo ">>> Step 3: Waiting for PostgreSQL service to become healthy..."
MAX_ATTEMPTS=30
ATTEMPT=1
until [ "$(docker inspect -f '{{.State.Health.Status}}' movie-metadata-postgres 2>/dev/null || echo 'starting')" = "healthy" ]; do
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        echo "ERROR: PostgreSQL failed to become healthy within $((MAX_ATTEMPTS * 2)) seconds."
        docker compose logs postgres
        exit 1
    fi
    echo "  Waiting for PostgreSQL (Attempt ${ATTEMPT}/${MAX_ATTEMPTS})..."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

echo ">>> PostgreSQL is healthy and initialized!"
echo ""
echo ">>> Step 4: Running automated validation suite..."
docker compose exec -T postgres psql -U "${POSTGRES_USER:-movie_admin}" -d "${POSTGRES_DB:-movies_db}" -f /docker-entrypoint-initdb.d/005_validation.sql

echo ""
echo "========================================================================"
echo " RESET COMPLETE! SUCCESSFUL ENVIRONMENT RESEED                           "
echo "========================================================================"
echo " PostgreSQL is running at: localhost:${POSTGRES_PORT:-5425}"
echo " Metabase is running at:   http://localhost:${METABASE_PORT:-3000}"
echo "========================================================================"

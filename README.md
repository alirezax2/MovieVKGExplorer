# PostgreSQL Virtual Knowledge Graph (VKG) & AI Query Interface

[![CI](https://github.com/alphigma/sona-knowledgegraph/actions/workflows/ci.yml/badge.svg)](https://github.com/alphigma/sona-knowledgegraph/actions/workflows/ci.yml)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Ontop 5.5.0](https://img.shields.io/badge/ontop-v5.5.0-orange.svg)](https://ontop-vkg.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Bun](https://img.shields.io/badge/Bun-1.4+-fbf0df.svg)](https://bun.sh/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

An enterprise-grade, locally deployable **Virtual Knowledge Graph (VKG)** and AI natural-language query interface over a pre-existing relational PostgreSQL movie database containing dummy movie data, taxonomy classes, subclasses, and metadata definitions.

Exposes relational tables as an on-demand RDF graph using **Ontop**, translates SPARQL into optimized SQL at query time, exposes a secure **FastAPI** backend, integrates with **OmniRoute** as an OpenAI-compatible LLM gateway, and provides a modern **React + Bun** explorer interface.

> [!TIP]
> **Detailed Engineering Guide:** For a deep dive into Virtual Knowledge Graph theory, Ontop internals, ontology semantics, OBDA mappings, and SPARQL-to-SQL query compilation with concrete examples, read [ARCHITECTURE_AND_VKG_GUIDE.md](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ARCHITECTURE_AND_VKG_GUIDE.md).

---

## 1. Architecture & Design Principles

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Bun Frontend                            │
│                 (AI Assistant, SPARQL Studio, Graph)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Application                              │
│  ┌───────────────────────┐  ┌────────────────┐  ┌───────────────────┐  │
│  │ AST SPARQL Validator  │  │ API Key Auth   │  │ OmniRoute Client  │  │
│  └───────────┬───────────┘  └────────────────┘  └─────────┬─────────┘  │
└──────────────┼────────────────────────────────────────────┼────────────┘
               │ SPARQL (Read-Only)                         │ JSON Chat
               ▼                                            ▼
┌───────────────────────────────┐           ┌────────────────────────────┐
│      Ontop 5.5.0 (VKG)        │           │    OmniRoute Gateway       │
│  - ontology.ttl               │           │  - OpenAI-compatible API   │
│  - mapping.obda               │           │  - SPARQL translation      │
│  - SPARQL-to-SQL rewriter     │           │  - Grounded synthesis      │
└──────────────┬────────────────┘           └────────────────────────────┘
               │ SQL Queries
               ▼
┌────────────────────────────────────────────────────────────────────────┐
│               PostgreSQL 16 Database (Source of Truth)                 │
│  Tables: object (1,000 movies), class (14), subclass (50),             │
│          relation_class_subclass (50), definition (68),                │
│          metadata_registry (68)                                        │
│  User: ontop_ro (Strictly SELECT permissions, no DDL/DML)              │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Tenets:
1. **Zero Data Replication / Zero Materialization:** Relational records remain solely within PostgreSQL. Ontop rewrites SPARQL queries into SQL on-the-fly; no separate triplestore or graph database is created.
2. **Source Data Preservation:** All existing tables, constraints, rows, and volumes are preserved intact. No DDL/DML statements modify production source tables during application runtime.
3. **Defense in Depth Security:**
   - Ontop connects using a dedicated `ontop_ro` read-only user without table modification rights.
   - Syntax-aware SPARQL AST validator powered by RDFLib rejects updates (`INSERT`, `DELETE`, `DROP`), federated queries (`SERVICE`), and dataset tampering (`FROM` / `FROM NAMED`).
   - Private loopback binding prevents exposing raw SPARQL endpoints to untrusted public networks.
   - API Key authentication guards all data access endpoints.
4. **Reproducible Tooling:** Python dependencies managed exclusively via `uv` with committed lockfiles (`uv.lock`); frontend managed with `bun`.

---

## 2. Relational Schema & Discovered Ontology

### Discovered Tables & Relationships

| PostgreSQL Table | Primary Key | Rows | VKG RDF Class | Semantic Description |
| :--- | :--- | :--- | :--- | :--- |
| `object` | `object_id` | 1,000 | `mv:Movie` | Movie entities with title, release year, director, runtime, and rating |
| `class` | `metaid` | 14 | `mv:MovieClass` | Top-level movie genres/taxonomy (e.g. Action, Comedy, Drama, Sci-Fi) |
| `subclass` | `metaid` | 50 | `mv:MovieSubclass` | Granular subcategories (e.g. Superhero, Martial Arts, Anime) |
| `relation_class_subclass` | `relation_id` | 50 | `mv:ClassSubclassRelation` | Explicit taxonomic mappings linking subclasses to parent classes |
| `definition` | `definition_id` | 68 | `mv:MetadataDefinition` | Specifications, versions, namespaces, and datatypes |
| `metadata_registry` | `metaid` | 68 | `mv:MetadataRegistryEntry` | Unified identifier registry tokens across all concepts |

### Ontology Vocabulary (Base IRI: `https://example.org/movie-vkg/`)

- **Classes:** `mv:Movie`, `mv:MovieClass`, `mv:MovieSubclass`, `mv:ClassSubclassRelation`, `mv:MetadataDefinition`, `mv:MetadataRegistryEntry`.
- **Object Properties:**
  - `mv:hasGenreClass`: `mv:Movie` &rarr; `mv:MovieClass`
  - `mv:hasSubclass`: `mv:Movie` &rarr; `mv:MovieSubclass`
  - `mv:belongsToClass`: `mv:MovieSubclass` &rarr; `mv:MovieClass`
  - `mv:hasParentClass`: `mv:ClassSubclassRelation` &rarr; `mv:MovieClass`
  - `mv:hasMetadataRegistry`: `mv:Movie` &rarr; `mv:MetadataRegistryEntry`
  - `mv:appliesToRegistry`: `mv:MetadataDefinition` &rarr; `mv:MetadataRegistryEntry`
- **Datatype Properties:**
  - `mv:title`, `mv:releaseYear`, `mv:director`, `mv:description`, `mv:runtimeMinutes`, `mv:rating`, `mv:originalLanguage`, `mv:name`, `mv:relationType`, `mv:metaid`, `mv:entityType`, `mv:dataType`, `mv:namespace`, `mv:version`.

---

## 3. Quick Start & Prerequisites

### Requirements:
- **Docker & Docker Compose** (for PostgreSQL, Metabase, Ontop)
- **Python 3.12+** and **uv** (`>= 0.11.0`)
- **Bun** (`>= 1.4.0`) for frontend development

### Step 1: Environment Setup
Copy the environment configuration template:
```bash
cp .env.example .env
```

Verify or update the configuration in `.env`:
```dotenv
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5425
POSTGRES_DB=movies_db
POSTGRES_USER=ontop_ro
POSTGRES_PASSWORD=dev_ontop_ro_secret_password_2026

ONTOP_ENDPOINT_URL=http://127.0.0.1:8825/sparql
API_KEY=dev_movie_vkg_secret_api_key_2026

OMNIROUTE_BASE_URL=https://omniroute.alphigma.com/v1
OMNIROUTE_API_KEY=sk-cba32ec1d23c3c6a-fcb67c-129aaa10
OMNIROUTE_MODEL=no-think/antigravity/claude-sonnet-4-6
```

### Step 2: Ensure Dedicated Read-Only PostgreSQL User Exists
If not already created, execute the administrator setup script:
```bash
# On Linux/macOS
docker exec -i movie-metadata-postgres psql -U movie_admin -d movies_db < scripts/setup_readonly_user.sql

# On Windows PowerShell
Get-Content scripts/setup_readonly_user.sql | docker exec -i movie-metadata-postgres psql -U movie_admin -d movies_db
```

### Step 3: Run Metadata Discovery & Mapping Validation
Inspect the live relational schema:
```bash
uv run python scripts/inspect_schema.py --include-row-counts
```

Validate ontology Turtle and Ontop OBDA mappings:
```bash
uv run python scripts/validate_mappings.py
```

### Step 4: Start Ontop Virtual Knowledge Graph Service
Using the unified Docker Compose stack:
```bash
docker compose up -d ontop
```

Or start the Ontop container individually:
```bash
docker run -d --name movie-metadata-ontop --network movie_metadata_network \
  -p 127.0.0.1:8825:8080 \
  -v "${PWD}/ontop:/opt/ontop/input:ro" \
  -v "${PWD}/ontop/jdbc:/opt/ontop/jdbc:ro" \
  -e ONTOP_ONTOLOGY_FILE=/opt/ontop/input/ontology.ttl \
  -e ONTOP_MAPPING_FILE=/opt/ontop/input/mapping.obda \
  -e ONTOP_PROPERTIES_FILE=/opt/ontop/input/ontop.properties \
  ontop/ontop:5.5.0
```

### Step 5: Start FastAPI Backend
```bash
uv run uvicorn app.main:app --host 127.0.0.1 --port 8025 --reload
```
API docs available at: `http://127.0.0.1:8025/docs`

### Step 6: Start React + Bun Frontend
```bash
cd frontend
bun install
bun run dev
```
Open your browser at: `http://localhost:5125`

---

## 4. API Endpoints & Usage

All protected endpoints require the `X-API-Key` header or `Authorization: Bearer <API_KEY>`.

### 1. Health & Readiness
```bash
# Liveness
curl -s http://127.0.0.1:8025/health

# Readiness check (PostgreSQL, Ontop, OmniRoute)
curl -s http://127.0.0.1:8025/ready
```

### 2. Discovered Relational Schema (`GET /schema`)
```bash
curl -s -H "X-API-Key: dev_movie_vkg_secret_api_key_2026" \
  http://127.0.0.1:8025/schema
```

### 3. Ontology Specification (`GET /ontology`)
```bash
curl -s -H "X-API-Key: dev_movie_vkg_secret_api_key_2026" \
  http://127.0.0.1:8025/ontology
```

### 4. Execute Read-Only SPARQL (`POST /query`)
```bash
curl -s -X POST http://127.0.0.1:8025/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_movie_vkg_secret_api_key_2026" \
  -d '{
    "query": "PREFIX : <https://example.org/movie-vkg/> SELECT ?title ?rating WHERE { ?m a :Movie ; :title ?title ; :rating ?rating } ORDER BY DESC(?rating) LIMIT 3",
    "limit": 10
  }'
```
**Example Response:**
```json
{
  "query": "PREFIX : <https://example.org/movie-vkg/> SELECT ?title ?rating WHERE { ?m a :Movie ; :title ?title ; :rating ?rating } ORDER BY DESC(?rating) LIMIT 3",
  "columns": ["title", "rating"],
  "row_count": 3,
  "results": [
    {"title": "Kingdom of Haven Part I", "rating": "9.7"},
    {"title": "Iron Chronicle", "rating": "9.7"},
    {"title": "Reckless Alliance Part II", "rating": "9.7"}
  ],
  "execution_time_ms": 142.3
}
```

### 5. Natural Language Query via OmniRoute (`POST /ask`)
```bash
curl -s -X POST http://127.0.0.1:8025/ask \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_movie_vkg_secret_api_key_2026" \
  -d '{"question": "What are the top 3 highest rated movies in the database?"}'
```
**Example Response:**
```json
{
  "question": "What are the top 3 highest rated movies in the database?",
  "generated_sparql": "PREFIX : <https://example.org/movie-vkg/> SELECT ?title ?rating WHERE { ?movie a :Movie ; :title ?title ; :rating ?rating . } ORDER BY DESC(?rating) LIMIT 3",
  "explanation": "The top 3 highest rated movies are 'Kingdom of Haven Part I', 'Iron Chronicle', and 'Reckless Alliance Part II', each holding an outstanding rating of 9.7.",
  "row_count": 3,
  "results": [
    {"title": "Kingdom of Haven Part I", "rating": "9.7"},
    {"title": "Iron Chronicle", "rating": "9.7"},
    {"title": "Reckless Alliance Part II", "rating": "9.7"}
  ],
  "execution_time_ms": 454.8,
  "model": "no-think/antigravity/claude-sonnet-4-6"
}
```

You can optionally select an active model or smart routing alias using the `"model"` field (e.g. `{"question": "...", "model": "auto/smart"}`):

| Model value | Best use in Alphigma |
| :--- | :--- |
| **`claude-sonnet`** | Direct Claude 3.5 Sonnet route / high precision |
| **`auto`** | General-purpose, balanced model selection |
| **`auto/smart`** | Complex quantitative research and difficult reasoning |
| **`auto/coding`** | Writing Python, debugging, and code generation |
| **`auto/fast`** | Interactive tools and low-latency tasks |
| **`auto/cheap`** | Bulk ingestion, simple summaries, and routine processing |
| **`auto/offline`** | Local model providers, where supported |

---


## 5. Security & Query Governance

- **Constrained SPARQL Grammar:** The validator (`app/security/sparql_validator.py`) enforces strict read-only queries. AST inspections recursively reject:
  - Updates: `INSERT`, `DELETE`, `LOAD`, `CLEAR`, `CREATE`, `DROP`, `MOVE`, `COPY`, `ADD`.
  - Federation: `SERVICE` keywords.
  - Graph/Dataset overrides: `FROM`, `FROM NAMED`.
- **System Limits Enforcement:** Automatically applies a capped `LIMIT` (default: 500) if omitted or higher than system bounds.
- **Secret Redaction:** Logs, error responses, and health endpoints never reveal database passwords, connection strings, or OmniRoute API keys.
- **Dedicated Role Isolation:** Ontop queries run as `ontop_ro`. Attempting DDL or table writes will fail at the PostgreSQL permission layer.

---

## 6. Automated Testing & Quality Checks

Run the automated test suite with coverage:
```bash
uv run pytest --cov=app --cov-report=term-missing
```

Run code formatting and linter checks:
```bash
uv run ruff check .
uv run ruff format --check .
```

### Verified Test Suite Summary:
- **Unit Tests:** Configuration defaults, alias fallbacks, AST SPARQL security validator, query capping, authentication rules, schema JSON verification, LLM response parsing, markdown stripping.
- **Integration Tests:** Ontop VKG live query execution, foreign-key taxonomy resolution, exact SQL vs SPARQL count and ranking agreement.
- **Safety Tests:** Explicit assertions that all 1,000 source movie records, 14 classes, 50 subclasses, and 68 definitions remain strictly unchanged.

---

## 7. Extending Mappings for Schema Changes

When adding new tables or columns to PostgreSQL:
1. Update `artifacts/schema.json` by running `uv run python scripts/inspect_schema.py`.
2. Add corresponding OWL classes or properties to `ontop/ontology.ttl`.
3. Add OBDA mapping blocks to `ontop/mapping.obda`.
4. Validate mapping syntax using `uv run python scripts/validate_mappings.py`.
5. Run `uv run pytest` to ensure regression tests pass.

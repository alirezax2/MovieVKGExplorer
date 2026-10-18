# Engineering Task Contract: PostgreSQL Virtual Knowledge Graph with Ontop, FastAPI, and OmniRoute

## 1. Mission

Build a production-minded, locally deployable **Virtual Knowledge Graph (VKG) and AI query interface** over an existing PostgreSQL database containing dummy movie data and relational class/subclass data.

Use:

- **PostgreSQL** as the existing source of truth.
- **Ontop** to expose relational tables as a virtual RDF knowledge graph.
- **FastAPI** to provide a secure HTTP API.
- **OmniRoute** as the OpenAI-compatible LLM gateway.
- **SPARQL** as the semantic query language.
- **uv** for Python dependency and environment management.
- **pytest** for unit, integration, and regression testing.
- **GitHub Actions** for continuous integration.

The system must allow users and AI agents to ask natural-language questions about the existing database. The LLM generates constrained SPARQL, Ontop translates SPARQL into SQL, PostgreSQL executes the query, and FastAPI returns the results and an AI-generated explanation.

The existing database is already populated. Do not create a replacement database, replace existing tables, insert additional demo records, or migrate source records into another graph database.

## 2. Non-negotiable requirements

1. Preserve all existing PostgreSQL tables, rows, schemas, relationships, constraints, and data.
2. Do not create or populate a separate graph database.
3. Do not materialize the source database as RDF triples in another database.
4. Use Ontop as a virtual knowledge graph over the existing PostgreSQL schema.
5. Discover existing tables, columns, primary keys, foreign keys, and relevant constraints before generating mappings.
6. Generate an initial ontology and Ontop OBDA mapping from the discovered schema.
7. Support relational classes and subclasses where their actual representation permits it.
8. Use FastAPI for the application API.
9. Use OmniRoute through its OpenAI-compatible API, configurable through environment variables.
10. Use `uv` for dependency management and reproducible environment setup.
11. Use pytest for automated tests.
12. Use GitHub Actions to run formatting, linting, type checks where configured, and tests.
13. Never hardcode real credentials, API keys, database passwords, or secrets.
14. Never expose the Ontop endpoint publicly by default.
15. Treat every LLM-generated query as untrusted input.

Distinguish source data from derived metadata. Ontology and OBDA mapping files are permitted. Caching, materialized triples, copied source tables, and separate graph stores are not permitted unless explicitly approved later.

## 3. Begin by inspecting the existing environment

Do not assume that PostgreSQL should be created by this project. The user already runs PostgreSQL using Docker Compose.

First, inspect the repository, existing Docker Compose file, `.env` variable names, network names, volumes, SQL initialization scripts, and existing database configuration.

Determine:

- PostgreSQL container and service names.
- PostgreSQL version and host port.
- Database name and available schemas.
- Existing tables and views.
- Column names and SQL types.
- Primary keys, foreign keys, unique constraints, and nullability.
- Existing class/subclass representation.
- Existing movie records and relationships, using only a small, read-only sample when necessary.
- Existing network configuration.
- Existing OmniRoute URL, authentication configuration, and supported model IDs.

Do not print passwords, API keys, or other secrets in logs or reports.

### Schema discovery

Implement a Python schema-inspection utility using SQLAlchemy and psycopg, managed through `uv`.

Generate a machine-readable report, such as `artifacts/schema.json`, containing:

- Database and schema names.
- Table and view names.
- Column names, types, and nullability.
- Primary-key columns.
- Foreign-key columns and referenced tables.
- Unique constraints.
- Table row counts only if explicitly enabled and safe to obtain.
- Mapping eligibility and warnings.

Default behavior must inspect metadata only. Avoid scanning entire tables or extracting all records.

Support multiple PostgreSQL schemas. Do not assume everything is in `public`.

Generate a report identifying tables with missing primary keys, ambiguous relationships, unsupported types, and potential mapping problems.

The schema inspector must not modify the database.

## 4. Understand the relational ontology

Infer the relational model from actual schema metadata and, where necessary, a small sample of records.

Possible concepts may include:

- `Movie`
- `Person`
- `Genre`
- `Class`
- `Subclass`
- `Category`
- `Relationship`

These are examples, not mandatory table names or classes.

Do not invent tables or assume that a table named `class` represents an RDF/OWL class. Determine the real meaning of each table.

Handle class/subclass data according to how it is represented:

1. If classes and subclasses are separate relational entities with foreign keys, map those entities and relationships.
2. If inheritance is represented by a discriminator column, create suitable class mappings and conditional mappings.
3. If classes and subclasses are records in a taxonomy table, map the taxonomy and parent-child relationships.
4. If the database already stores RDF or OWL terms, preserve their semantic meaning and identifiers.
5. If no reliable subclass structure can be inferred, report the ambiguity rather than inventing semantics.

Distinguish two different concepts:

- Relational relationships: foreign keys and other documented business relationships.
- Ontological subclass relationships: semantic `rdfs:subClassOf` statements.

A foreign key between two records does not automatically imply an ontology subclass relationship.

## 5. Ontop virtual knowledge graph

Use Ontop's official Docker image and supported configuration mechanisms. Pin a validated version or digest for reproducible deployment rather than relying indefinitely on `latest`.

Create and maintain:

- `ontop/ontology.ttl`
- `ontop/mapping.obda`
- `ontop/db.properties` or an equivalent secret-safe runtime configuration.

The ontology must define appropriate RDF classes, properties, and stable identifiers based on the existing relational schema.

Use consistent IRIs, for example:

`https://example.org/movie-vkg/`

Choose a namespace configurable through environment variables.

### Mapping requirements

Generate mappings for:

- Tables with stable primary keys.
- Foreign-key relationships.
- Relevant string, numeric, boolean, date, and timestamp properties.
- Existing class/subclass relationships where supported by the schema.
- Explicitly approved views when useful.

Create stable subject IRIs from primary-key values. Ensure composite keys are encoded without collisions.

Use appropriate SQL-to-RDF datatype mappings. Handle nullable columns without producing invalid or misleading values.

Never create mappings that silently assume every column is semantically meaningful.

If a table has no stable key, flag it for review. Do not use an unstable row number as a permanent identifier.

### Mapping validation

After generating the files:

1. Validate ontology syntax.
2. Validate OBDA mapping syntax using the supported Ontop CLI.
3. Start Ontop and verify that it connects to PostgreSQL.
4. Run a basic SPARQL `SELECT` query.
5. Compare selected results against equivalent SQL queries.
6. Verify foreign-key relationships and class/subclass semantics.
7. Report unsupported columns and unmapped tables.

The bootstrap process must be repeatable and must not modify source records.

If automatic bootstrap fails because of version-specific CLI behavior, inspect the installed version's help and documentation and correct the implementation. Do not silently report success.

## 6. Database access and isolation

Use a dedicated PostgreSQL read-only account for Ontop.

The implementation must not use the existing database administrator account for application queries.

Provide an optional SQL setup script that an administrator can execute explicitly to grant:

- `CONNECT` on the intended database.
- `USAGE` on approved schemas.
- `SELECT` on approved tables and views.
- Default `SELECT` privileges for future tables created by the relevant owner roles, where required.

Do not run privilege-changing SQL automatically during normal application startup.

Support an allowlist of schemas and tables where practical.

The Ontop service must connect to the existing PostgreSQL container using its Compose service name and internal port, not `localhost`.

Do not create a second PostgreSQL service or volume.

Do not remove, rename, or replace existing Docker services, volumes, networks, or configuration.

## 7. FastAPI application

Create a clean Python package with clear separation of concerns.

Suggested layout:

```text
app/
  main.py
  config.py
  api/
    health.py
    schema.py
    query.py
    ask.py
  services/
    schema_service.py
    ontology_service.py
    sparql_service.py
    llm_service.py
  security/
    authentication.py
    sparql_validator.py
  models/
    requests.py
    responses.py
scripts/
  inspect_schema.py
  generate_mappings.py
  validate_mappings.py
ontop/
  ontology.ttl
  mapping.obda
tests/
  unit/
  integration/
.github/
  workflows/
pyproject.toml
uv.lock
Dockerfile
docker-compose.yml
.env.example
README.md
```

Adapt this layout to the existing repository instead of overwriting unrelated files.

### API endpoints

Implement:

- `GET /health`: application health.
- `GET /ready`: verify essential dependencies are reachable without exposing secrets.
- `GET /schema`: return safe schema and mapping metadata.
- `GET /ontology`: return an approved ontology representation or summary.
- `POST /query`: execute a validated, read-only SPARQL query.
- `POST /ask`: accept a natural-language question, generate SPARQL, validate it, execute it through Ontop, and produce an answer.
- `GET /docs`: interactive OpenAPI documentation in development.

Use Pydantic request and response models. Return structured errors with suitable HTTP status codes. Do not return stack traces, connection strings, credentials, or raw internal exceptions to clients.

Protect data/query endpoints with API-key authentication. Support future integration with a stronger authentication provider.

## 8. OmniRoute LLM integration

Use the OpenAI Python SDK or a suitable asynchronous HTTP client with a configurable OpenAI-compatible base URL.

Example environment variables:

```dotenv
OMNIROUTE_BASE_URL=http://host.docker.internal:20128/v1
OMNIROUTE_API_KEY=replace_me
OMNIROUTE_MODEL=replace_with_supported_model_id
```

These values are examples. Inspect the existing OmniRoute configuration and use the correct port and model identifier.

Never log the API key or transmit it to Ontop or PostgreSQL.

### Query generation workflow

For each natural-language request:

1. Validate the request length and reject empty or obviously abusive input.
2. Retrieve the relevant ontology, mapping vocabulary, and approved schema context.
3. Send only the necessary metadata and user question to the LLM.
4. Instruct the LLM to return structured JSON containing the SPARQL query and, optionally, a brief query explanation.
5. Parse the response strictly.
6. Reject invalid JSON, invented predicates, unknown classes, unsupported query forms, and malformed SPARQL.
7. Validate the query independently of the LLM.
8. Execute it only through the private Ontop endpoint.
9. Return the query, bounded result set, and query metadata.
10. Send the bounded results to the LLM for a factual explanation.
11. Ensure the explanation is grounded in the returned records.

If the model cannot answer a question using the available ontology, return a clear explanation rather than inventing vocabulary or data.

Support configurable model IDs and request timeouts. Do not assume every provider supports JSON mode or identical OpenAI API features; provide a tested fallback where necessary.

Do not require an LLM call for direct SPARQL queries.

## 9. Constrained SPARQL and query security

Implement a dedicated query-validation module.

Allow only the explicitly supported read-only query forms. For the initial release, support `SELECT` only.

Reject:

- SPARQL updates.
- `INSERT`, `DELETE`, `LOAD`, `CLEAR`, `CREATE`, `DROP`, and similar update operations.
- `SERVICE` and federated queries.
- Unapproved `FROM` clauses.
- Unapproved graph access.
- Unknown predicates and classes where ontology-aware validation is possible.
- Multiple statements or malformed queries.
- Excessively complex or excessively large queries.

Do not rely exclusively on regular expressions. Use a SPARQL parser or equivalent syntax-aware validation and inspect the parsed query structure.

Apply configurable controls:

- Maximum result count.
- Query execution timeout.
- Maximum request size.
- LLM timeout.
- Maximum LLM input/output tokens where supported.
- Rate limits.
- Per-request audit logging without secrets or unnecessary sensitive content.

Use defense in depth: private Ontop networking, PostgreSQL read-only privileges, query validation, and endpoint authorization.

A SPARQL `LIMIT` alone does not guarantee low query cost. Where supported, configure database-side statement timeouts and appropriate resource limits. Avoid exposing Ontop directly to untrusted clients.

Treat retrieved text and user-supplied content as data, not as instructions to the LLM.

## 10. Python dependency management with uv

Use `uv` as the single Python environment and dependency management tool.

Requirements:

- Define runtime dependencies in `pyproject.toml`.
- Define development dependencies for pytest, Ruff, and any chosen type checker.
- Generate and commit `uv.lock`.
- Use `uv sync --frozen` in CI and reproducible Docker builds.
- Use `uv run` for application scripts and tests.
- Set supported Python versions explicitly.
- Avoid mixing Poetry, Pipenv, or manually maintained requirements files unless the repository already requires them.

Use an appropriate dependency set, potentially including:

- FastAPI
- Uvicorn
- Pydantic Settings
- HTTPX
- OpenAI Python SDK
- SQLAlchemy
- psycopg
- pytest
- pytest-cov
- Ruff
- mypy or Pyright

Use only dependencies that are actually required.

## 11. Testing strategy

Write tests before declaring the system complete.

### Unit tests

Test:

- Configuration parsing and validation.
- Schema normalization.
- Primary-key and foreign-key discovery.
- IRI generation, including composite keys and escaping.
- Ontology and mapping generation.
- SPARQL parsing and validation.
- Query size and result-limit enforcement.
- Rejection of update and federated queries.
- OmniRoute response parsing.
- Handling of malformed model output.
- Error handling and timeout behavior.
- API authentication and authorization.

### Integration tests

Use a dedicated disposable test database or isolated test schema with synthetic data. Do not alter or reset the user's existing movie database during automated tests.

Test:

- Ontop starts and connects to PostgreSQL.
- Mappings load successfully.
- A known SPARQL query returns expected results.
- Foreign-key relationships are represented correctly.
- Class/subclass queries return the expected semantic relationships.
- SPARQL results match equivalent SQL results.
- FastAPI communicates with Ontop.
- `/ask` works using a mocked LLM.
- Invalid or unsafe generated queries never reach Ontop.

Tests must not require a paid LLM API key or internet access to the production OmniRoute service. Use mocked LLM responses by default, with optional manually triggered end-to-end tests.

### Regression and safety tests

Include explicit tests proving that:

- Existing database row counts and data remain unchanged.
- No application startup operation performs DDL or DML against source tables.
- No source data is copied into a separate graph database.
- Secrets are not included in API responses or logs.
- Ontop is not published on a public network interface by default.

Use database snapshots or isolated disposable databases where appropriate; do not rely on a destructive test against the real database.

## 12. GitHub Actions

Create a CI workflow, for example `.github/workflows/ci.yml`.

Run on pull requests and pushes to the main development branch.

Recommended jobs:

1. **Quality checks**
   - Checkout source.
   - Install a pinned `uv` version.
   - Set up the supported Python version.
   - Run `uv sync --frozen`.
   - Run Ruff formatting checks.
   - Run Ruff linting.
   - Run configured type checks.

2. **Unit tests**
   - Run pytest.
   - Produce a coverage report.
   - Enforce a reasonable minimum coverage threshold after the baseline is established.

3. **Integration tests**
   - Start a disposable PostgreSQL service or use an isolated test Compose stack.
   - Start Ontop if required for the integration suite.
   - Apply test-only schema and synthetic fixtures.
   - Run integration tests.
   - Clean up test resources even when a job fails.

4. **Security and configuration checks**
   - Verify `.env` and secret-bearing files are not tracked.
   - Check for accidentally committed credentials.
   - Optionally add dependency vulnerability scanning.

CI must not connect to or modify the user's existing local PostgreSQL database. Do not require the production OmniRoute API key in GitHub Actions.

Use pinned action versions and least-privilege workflow permissions.

## 13. Docker Compose integration

Extend the user's existing Docker Compose project rather than replacing it.

Preserve:

- Existing PostgreSQL service and image.
- Existing PostgreSQL data volume.
- Existing Metabase service.
- Existing network and service names.
- Existing port configuration unless a documented conflict requires adjustment.

Add:

- Ontop.
- FastAPI.

Use the existing PostgreSQL service as Ontop's database dependency. Use the existing Compose network for internal communication.

Bind the Ontop endpoint to loopback or leave it unexposed and access it only from FastAPI. Bind FastAPI to loopback by default for local development.

Do not put the PostgreSQL administrator password in the Ontop configuration.

Use health checks and service readiness handling. Do not assume that `depends_on` alone means Ontop is ready to accept SPARQL queries.

Use `.env.example` for documented variable names, never real credentials.

If existing environment variables conflict with the new application, preserve backward compatibility and document the resolution.

## 14. Observability and diagnostics

Provide useful operational diagnostics:

- Schema inspection summary.
- Ontology and mapping validation report.
- Ontop connection status.
- PostgreSQL connection status.
- OmniRoute connectivity status, without disclosing credentials.
- Query duration and result count.
- Validation rejection reasons.
- Request correlation IDs.
- Structured logs with sensitive content redacted.

Do not log complete movie records or full prompts by default. Make verbose debugging explicitly opt-in for local development.

## 15. Documentation

Write a complete README that explains:

- Architecture and design decisions.
- Source-data preservation guarantees.
- Requirements.
- Environment configuration.
- Existing PostgreSQL integration.
- Read-only account setup.
- Schema inspection.
- Ontology and OBDA mapping generation.
- Local startup and shutdown.
- SPARQL examples based on the actual generated ontology.
- Natural-language query examples.
- API authentication.
- Running unit and integration tests.
- GitHub Actions behavior.
- Troubleshooting.
- Security limitations.
- How to add new mappings when database tables change.

Include example `curl` commands and example responses.

Never use fictitious class or predicate IRIs in examples without clearly identifying them as placeholders.

## 16. Implementation workflow

Follow this sequence.

### Stage A — Discovery

Inspect the repository and existing Compose environment. Generate the schema report and explain the actual database structure.

**Do not proceed with guessed table names or relationships.**

### Stage B — Mapping generation

Generate the ontology and OBDA mappings from the real schema. Validate them using Ontop and review class/subclass semantics.

### Stage C — Read-only graph queries

Start Ontop, execute known SPARQL queries, and compare their results against SQL.

### Stage D — FastAPI

Implement and test `/health`, `/ready`, `/schema`, `/ontology`, and `/query`.

### Stage E — OmniRoute

Implement constrained natural-language-to-SPARQL generation and result-grounded answer synthesis.

### Stage F — Quality and automation

Implement pytest coverage, CI, security checks, and reproducible `uv` setup.

### Stage G — Final validation

Run all applicable tests and provide a factual implementation report.

Do not claim a stage passed unless the corresponding command or test actually succeeded.

If the coding environment has access to the repository, inspect and modify the actual files. If it does not have access, request the relevant files or produce a clearly labeled patch rather than claiming to have deployed the application.

## 17. Acceptance criteria

The task is complete only when:

- The existing PostgreSQL service and data volume are preserved.
- Schema inspection reports the actual tables and relationships.
- Ontop loads a valid ontology and mapping generated from the real schema.
- A SPARQL query returns expected results from the existing PostgreSQL data.
- SQL and SPARQL results agree for tested cases.
- Class/subclass semantics match the actual relational model.
- FastAPI successfully executes validated SPARQL through Ontop.
- OmniRoute can generate a valid query using the configured model.
- Invalid or unsafe queries are rejected.
- Answers are grounded in query results.
- Automated tests pass.
- GitHub Actions runs the expected checks.
- The application uses `uv` and a committed lockfile.
- No source records have been copied into another graph database.
- No production source tables have been modified by the implementation.
- The README documents setup, operation, and limitations.

## 18. Required final report

At completion, report:

1. Files created or changed.
2. Actual PostgreSQL schemas, tables, keys, and relationships discovered.
3. Ontology classes and predicates generated.
4. Ontop mapping validation results.
5. SPARQL and SQL comparison results.
6. FastAPI endpoint test results.
7. OmniRoute integration test results.
8. pytest summary and coverage.
9. GitHub Actions workflow status, if executed.
10. Confirmation of whether source records were preserved and whether any data-changing SQL was executed.
11. Known limitations and next steps.

**Priority:** Correctness, source-data preservation, security, and verifiable tests take precedence over adding features or claiming completion quickly.
# Comprehensive Guide: Virtual Knowledge Graphs, Ontop, Ontologies, SPARQL, and Full-Stack Semantic Architecture

This document provides an exhaustive technical deep dive into **Virtual Knowledge Graphs (VKG)**, **Ontop**, **OWL Ontologies**, **OBDA Mappings**, **SPARQL-to-SQL Query Rewriting**, the **FastAPI Security Layer**, the **OmniRoute LLM Gateway**, and the **React + Bun Frontend**.

---

## Table of Contents
1. [What is a Virtual Knowledge Graph (VKG)?](#1-what-is-a-virtual-knowledge-graph-vkg)
2. [Ontop: The Engine Behind the VKG](#2-ontop-the-engine-behind-the-vkg)
3. [The Relational Ontology (OWL / Turtle)](#3-the-relational-ontology-owl--turtle)
4. [OBDA Mappings: Connecting Relational Tables to Graphs](#4-obda-mappings-connecting-relational-tables-to-graphs)
5. [SPARQL by Example](#5-sparql-by-example)
6. [Under the Hood: How SPARQL Translates to SQL](#6-under-the-hood-how-sparql-translates-to-sql)
7. [FastAPI Application & Security Architecture](#7-fastapi-application--security-architecture)
8. [OmniRoute AI Integration & Result Grounding](#8-omniroute-ai-integration--result-grounding)
9. [Frontend: React, Bun, and Vite](#9-frontend-react-bun-and-vite)
10. [Docker Compose & End-to-End Topology](#10-docker-compose--end-to-end-topology)

---

## 1. What is a Virtual Knowledge Graph (VKG)?

### The Core Problem
Enterprises and modern systems store primary transactional data in relational databases (such as PostgreSQL, MySQL, Oracle, or SQL Server). When organizations want to expose semantic relationships, perform knowledge graph queries, or connect Large Language Models (LLMs) to structured enterprise data, traditional approaches typically propose:
1. **ETL Pipelines**: Extracting millions of rows from relational databases, converting them into RDF triples, and inserting them into a separate Graph Database (e.g., Neo4j, GraphDB, Stardog, AllegroGraph).
2. **Dual-Store Synchronization**: Maintaining real-time change-data-capture (CDC) pipelines to prevent data drift between PostgreSQL and the Graph store.

### The Virtual Knowledge Graph Solution (OBDA)
**Ontology-Based Data Access (OBDA)** eliminates duplicate storage by introducing a **Virtual Knowledge Graph**:

```
Traditional ETL (Materialized Graph):
[PostgreSQL] ──(Heavy ETL)──> [RDF Triples] ──(Write)──> [Graph Database] ──> [SPARQL Query]
                                  ▲
                         (Data Drift & Duplication)

Virtual Knowledge Graph (Ontop):
[PostgreSQL] <──(On-The-Fly SQL)── [Ontop VKG Engine] <──(SPARQL Query)
(Single Source of Truth)              ▲
                                      ├── Ontology (Classes & Properties)
                                      └── OBDA Mapping (SQL-to-RDF rules)
```

### Why VKG Over Materialization?
- **Zero Data Replication**: No secondary storage costs or data synchronization pipelines.
- **Immediate Consistency**: Any record updated in PostgreSQL is immediately reflected in SPARQL queries.
- **Relational ACID & Optimization**: Queries leverage PostgreSQL's indexes, query optimizer, transaction isolation, and foreign-key constraints.
- **Source Preservation**: Production source schemas and tables remain untouched.

---

## 2. Ontop: The Engine Behind the VKG

### What is Ontop?
**Ontop** is the state-of-the-art open-source Virtual Knowledge Graph framework developed by the Free University of Bozen-Bolzano. It complies with W3C standards:
- **RDFS / OWL 2 QL**: Ontology reasoning and taxonomic inference.
- **R2RML / Ontop OBDA**: Declarative mappings from relational tables to RDF triples.
- **SPARQL 1.1**: The semantic query language for RDF.

### How Ontop Works
Ontop does **not** fetch entire tables into memory. Instead:
1. It parses an incoming **SPARQL** query into an Abstract Syntax Tree (AST).
2. It expands query patterns using the **Ontology axioms** (e.g., taxonomic hierarchy).
3. It unfolds the patterns using the **OBDA Mappings** to identify relevant SQL tables.
4. It applies relational optimizations (**Join Elimination**, **Self-Join Removal**, **Constraint Propagation**).
5. It compiles the optimized tree into a single, high-performance **SQL query**.
6. It sends the SQL query via JDBC to PostgreSQL.
7. It transforms the streaming SQL result set into W3C SPARQL JSON bindings (`application/sparql-results+json`).

### Why JDBC Driver Mounting is Required
The official `ontop/ontop` Docker image contains only the Java runtime and the Ontop query engine. To connect to PostgreSQL, it requires the PostgreSQL JDBC Driver (`org.postgresql.Driver`).
In our deployment:
- We downloaded `postgresql-42.7.4.jar` into [`ontop/jdbc/`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ontop/jdbc).
- In `docker-compose.yml`, this directory is mounted to `/opt/ontop/jdbc:ro`. Ontop dynamically loads any `.jar` files present in this directory on container startup.

---

## 3. The Relational Ontology (OWL / Turtle)

An ontology defines the **shared vocabulary, semantic classes, and relationships** of a domain, completely decoupled from physical database column names.

### Anatomy of an RDF Ontology
1. **IRIs (Internationalized Resource Identifiers)**: Every concept, class, property, and entity is uniquely identified by an IRI.
   - Base IRI: `https://example.org/movie-vkg/`
   - Class IRI: `<https://example.org/movie-vkg/Movie>` (or prefixed as `:Movie`)
2. **OWL Classes (`owl:Class`)**: Categories of entities.
3. **Object Properties (`owl:ObjectProperty`)**: Predicates linking an entity to another entity (entity &rarr; entity).
4. **Datatype Properties (`owl:DatatypeProperty`)**: Predicates linking an entity to a literal value (entity &rarr; string, integer, decimal).

### Concrete Implementation: `ontop/ontology.ttl`

Below is an annotated excerpt from [`ontop/ontology.ttl`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ontop/ontology.ttl):

```turtle
@prefix : <https://example.org/movie-vkg/> .
@prefix mv: <https://example.org/movie-vkg/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# 1. Classes
mv:Movie a owl:Class ;
    rdfs:label "Movie"@en ;
    rdfs:comment "A movie entity representing a film record with attributes."@en .

mv:MovieClass a owl:Class ;
    rdfs:label "Movie Class"@en ;
    rdfs:comment "Top-level taxonomy category (e.g., Action, Drama, Sci-Fi)."@en .

mv:MovieSubclass a owl:Class ;
    rdfs:label "Movie Subclass"@en ;
    rdfs:comment "Granular subcategory strictly belonging to a parent Movie Class."@en .

# 2. Object Properties (Relationships between entities)
mv:hasGenreClass a owl:ObjectProperty ;
    rdfs:label "has genre class"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range mv:MovieClass .

mv:belongsToClass a owl:ObjectProperty ;
    rdfs:label "belongs to class"@en ;
    rdfs:domain mv:MovieSubclass ;
    rdfs:range mv:MovieClass .

# 3. Datatype Properties (Attributes with literal values)
mv:title a owl:DatatypeProperty ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:string .

mv:releaseYear a owl:DatatypeProperty ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:integer .

mv:rating a owl:DatatypeProperty ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:decimal .
```

---

## 4. OBDA Mappings: Connecting Relational Tables to Graphs

An **OBDA (Ontology-Based Data Access) mapping file** defines rules that transform relational table rows into RDF triples.

### Structure of an OBDA Mapping
Each mapping has three elements:
1. `mappingId`: A unique name for the mapping rule.
2. `target`: The RDF triple pattern to generate. Placeholders like `{column_name}` are replaced with values from the SQL row.
3. `source`: The SQL query executed against PostgreSQL to retrieve candidate records.

### Concrete Implementation: `ontop/mapping.obda`

Below are the key mapping rules configured in [`ontop/mapping.obda`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ontop/mapping.obda):

```obda
[PrefixDeclaration]
:       https://example.org/movie-vkg/
owl:    http://www.w3.org/2002/07/owl#
rdf:    http://www.w3.org/1999/02/22-rdf-syntax-ns#
rdfs:   http://www.w3.org/2000/01/rdf-schema#
xsd:    http://www.w3.org/2001/XMLSchema#

[MappingDeclaration] @collection [[

# ------------------------------------------------------------------------------
# Mapping 1: Movies (object table)
# ------------------------------------------------------------------------------
mappingId   mapping-movie-objects
target      :movie/{object_id} a :Movie ;
                :title {title}^^xsd:string ;
                :releaseYear {release_year}^^xsd:integer ;
                :director {director}^^xsd:string ;
                :description {description}^^xsd:string ;
                :runtimeMinutes {runtime_minutes}^^xsd:integer ;
                :rating {rating}^^xsd:decimal ;
                :originalLanguage {original_language}^^xsd:string ;
                :hasGenreClass :class/{class} ;
                :hasSubclass :subclass/{subclass} ;
                :hasMetadataRegistry :registry/{metaid} .
source      SELECT object_id, title, release_year, director, description, 
                   "class", subclass, metaid, runtime_minutes, rating, original_language 
            FROM "public"."object"

# ------------------------------------------------------------------------------
# Mapping 2: Taxonomy Classes (class table)
# ------------------------------------------------------------------------------
mappingId   mapping-movie-classes
target      :class/{metaid} a :MovieClass ;
                :name {name}^^xsd:string ;
                :description {description}^^xsd:string ;
                rdfs:label {name}^^xsd:string ;
                :metaid {metaid}^^xsd:string .
source      SELECT metaid, name, description 
            FROM "public"."class"

# ------------------------------------------------------------------------------
# Mapping 3: Subclasses & Hierarchy (subclass table)
# ------------------------------------------------------------------------------
mappingId   mapping-movie-subclasses
target      :subclass/{metaid} a :MovieSubclass ;
                :name {name}^^xsd:string ;
                :description {description}^^xsd:string ;
                :belongsToClass :class/{class_metaid} ;
                rdfs:label {name}^^xsd:string ;
                :metaid {metaid}^^xsd:string .
source      SELECT metaid, class_metaid, name, description 
            FROM "public"."subclass"
]]
```

### Understanding IRI Templates
- When PostgreSQL yields `object_id = 42`, the target template `:movie/{object_id}` generates the IRI `<https://example.org/movie-vkg/movie/42>`.
- When PostgreSQL yields foreign key `class = 'class:action'`, `:hasGenreClass :class/{class}` generates `<https://example.org/movie-vkg/class/class:action>`.
- Notice that `:class/{metaid}` in Mapping 2 creates the exact same subject IRI. Because both IRIs match, Ontop automatically establishes the graph relationship between the movie and its class without any physical RDF pointers.

---

## 5. SPARQL by Example

SPARQL (SPARQL Protocol and RDF Query Language) queries RDF graphs by pattern matching triples: `(Subject, Predicate, Object)`.

### Example 1: Top 5 Highest Rated Movies
**Goal:** Retrieve film titles, release years, directors, and ratings.

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?title ?year ?director ?rating WHERE {
    ?m a :Movie ;
       :title ?title ;
       :releaseYear ?year ;
       :director ?director ;
       :rating ?rating .
}
ORDER BY DESC(?rating) ?title
LIMIT 5
```

### Example 2: Taxonomy Hierarchy (Subclasses Belonging to "Action")
**Goal:** Query the ontology hierarchy to discover what specialized subgenres belong to "Action".

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?subclassName ?description WHERE {
    ?sc a :MovieSubclass ;
        :name ?subclassName ;
        :description ?description ;
        :belongsToClass ?c .
    ?c a :MovieClass ;
       :name "Action" .
}
ORDER BY ?subclassName
```

### Example 3: Filter Movies by Subgenre and Release Window
**Goal:** Find Superhero movies released in or after 2010 with a rating of 8.0 or higher.

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?title ?rating ?year WHERE {
    ?m a :Movie ;
       :title ?title ;
       :rating ?rating ;
       :releaseYear ?year ;
       :hasSubclass ?sc .
    ?sc :name "Superhero" .
    FILTER (?year >= 2010 && ?rating >= 8.0)
}
ORDER BY DESC(?rating)
```

### Example 4: Analytical Aggregations (Average Rating by Class)
**Goal:** Compute the average rating and movie count grouped by top-level class.

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?className (COUNT(?m) AS ?totalMovies) (ROUND(AVG(?rating)*10)/10 AS ?avgRating) WHERE {
    ?m a :Movie ;
       :rating ?rating ;
       :hasGenreClass ?c .
    ?c :name ?className .
}
GROUP BY ?className
ORDER BY DESC(?totalMovies)
```

---

## 6. Under the Hood: How SPARQL Translates to SQL

Let's trace how Ontop compiles a SPARQL query into an optimized SQL statement.

### The Input SPARQL Query
```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?title ?rating WHERE {
    ?m a :Movie ;
       :title ?title ;
       :rating ?rating ;
       :hasGenreClass ?c .
    ?c :name "Sci-Fi" .
}
LIMIT 5
```

### What a Naive Translator Would Do (Bad)
A naive system would generate 4 separate SQL queries for `?m a :Movie`, `?m :title ?title`, `?m :rating ?rating`, and `?c :name "Sci-Fi"`, and perform 3 expensive inner joins on `object_id`.

### What Ontop Actually Does (Optimized)
1. **Mapping Unfolding**: Ontop inspects `mapping-movie-objects`. It observes that `:title`, `:rating`, and `:hasGenreClass` all originate from the **single relational table** `public.object`.
2. **Join Elimination**: Because `object."class"` foreign-keys directly into `public.class.metaid`, and `public.class.name = 'Sci-Fi'`, Ontop rewrites the graph join into an inner join between `object` and `class`.
3. **Column Projection**: Only `title` and `rating` are projected. Unused columns (`director`, `runtime_minutes`, etc.) are eliminated from the SQL `SELECT` list.

### The SQL Generated by Ontop and Executed on PostgreSQL
```sql
SELECT 
    t1.title AS "title",
    t1.rating AS "rating"
FROM public.object t1
INNER JOIN public.class t2 
    ON t1."class" = t2.metaid
WHERE t2.name = 'Sci-Fi'
LIMIT 5;
```

**Result:** The SPARQL query runs at native PostgreSQL relational speed (~2–10 milliseconds) using the indexes on `idx_object_class` and `uq_class_name`!

---

## 7. FastAPI Application & Security Architecture

The FastAPI backend ([`app/main.py`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/app/main.py)) acts as the secure query broker between clients, Ontop, and the OmniRoute LLM gateway.

```
Incoming Request
       │
       ▼
[FastAPI Middleware & Auth] ──(Validates X-API-Key / Bearer Token)
       │
       ▼
[SPARQL AST Validator] ──────(RDFLib checks: Only SELECT, No Updates, No SERVICE)
       │
       ▼
[SPARQL Limit Enforcer] ─────(Injects / Caps LIMIT <= 500)
       │
       ▼
[Ontop SPARQL Client] ───────(Submits query to private Ontop loopback)
       │
       ▼
[PostgreSQL Database] ───────(Executes as dedicated read-only role 'ontop_ro')
```

### Security Measures:
1. **Dedicated Read-Only Role (`ontop_ro`)**:
   Created by [`scripts/setup_readonly_user.sql`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/scripts/setup_readonly_user.sql). Holds only `SELECT` privileges on tables and views. Any DDL (`CREATE`, `DROP`, `ALTER`) or DML (`INSERT`, `UPDATE`, `DELETE`) is rejected at the PostgreSQL database kernel level.
2. **RDFLib Syntax-Aware AST Validator** ([`app/security/sparql_validator.py`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/app/security/sparql_validator.py)):
   - Does **not** rely on naive regular expressions alone.
   - Parses the query into a formal AST using `rdflib.plugins.sparql.parser.parseQuery`.
   - Rejects non-`SELECT` operations (`CONSTRUCT`, `DESCRIBE`, `ASK`, updates).
   - Rejects federated queries (`SERVICE <http://...>`).
   - Rejects dataset manipulation (`FROM <http://...>`).
   - Automatically injects `LIMIT 500` if no limit is specified, or clamps user limits that exceed the maximum threshold.
3. **Zero Secret Leakage**:
   Health checks, readiness probes, and error handlers sanitize error strings. Passwords, connection strings, and LLM API keys are never output to clients or standard logs.

---

## 8. OmniRoute AI Integration & Result Grounding

The `/ask` endpoint allows users to ask plain English questions. It executes a two-phase grounded generation workflow:

```
Step 1: User Question ("What are the top 3 highest rated movies?")
                 │
                 ▼
Step 2: Inject Ontology Context (Classes, ObjectProperties, DatatypeProperties)
                 │
                 ▼
Step 3: Call OmniRoute LLM (Model: no-think/antigravity/claude-sonnet-4-6)
                 │
                 ▼
Step 4: Strict JSON Extraction (Extract 'sparql' and 'explanation')
                 │
                 ▼
Step 5: Run SPARQL Query through Security Validator & Ontop VKG
                 │
                 ▼
Step 6: Receive Bounded Record Results from PostgreSQL
                 │
                 ▼
Step 7: Second LLM Call (Grounded Answer Synthesis)
        Instruct model to answer STRICTLY using returned records.
                 │
                 ▼
Step 8: Return Unified JSON Response (Question, SPARQL, Results, Grounded Answer)
```

If an LLM produces an invalid query, the AST validator catches it before it touches Ontop, protecting database resources. If a user asks a question outside the domain of the ontology, the model reports that the ontology lacks relevant vocabulary rather than hallucinating predicates.

### OmniRoute Models & Alphigma Smart Routing Aliases

The API and frontend provide a dynamic model selector supporting dedicated model routing and Alphigma smart routing aliases from `omniroute.alphigma.com`:

| Model Value | Category | Best Use in Alphigma |
| :--- | :--- | :--- |
| **`claude-sonnet`** | Direct Dedicated | Default high-precision model pipeline & grounded SPARQL translation |
| **`auto`** | Smart Routing | General-purpose, balanced model selection |
| **`auto/smart`** | Smart Routing | Complex quantitative research and difficult reasoning |
| **`auto/coding`** | Smart Routing | Writing Python, debugging, and code generation |
| **`auto/fast`** | Smart Routing | Interactive tools and low-latency tasks |
| **`auto/cheap`** | Smart Routing | Bulk ingestion, simple summaries, and routine processing |
| **`auto/offline`** | Smart Routing | Local model providers, where supported |

Available models can also be queried programmatically via `GET /models`.

---


## 9. Frontend: React, Bun, and Vite

The frontend ([`frontend/`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/frontend)) is a modern Single Page Application (SPA) built using **React 19**, **Vite 8**, and **Bun 1.4**:

### Key Features:
- **AI Assistant Tab**: Natural language question bar, pre-suggested queries, streaming status, grounded answer display, syntax-highlighted generated SPARQL with one-click copy, and interactive record table.
- **SPARQL Studio Tab**: Interactive query editor with pre-loaded templates (Top Rated Movies, Hierarchy, Metadata Definitions), execution latency metrics, and CSV export.
- **Ontology Explorer Tab**: Visual card inspector for OWL classes, object properties, and datatype properties, with toggleable raw Turtle (.ttl) viewer.
- **Relational Schema Tab**: Live inspection of discovered PostgreSQL tables, primary keys, foreign keys, and row counts.
- **Glassmorphic UI**: Tailored dark-mode palette (`#0a0e17`), CSS backdrop blur filters, glowing state badges, and Lucide icons.

### Why Bun?
- **Speed**: Bun installs dependencies in ~1 second and runs Vite's development server with minimal overhead.
- **Containerized**: Runs inside the `movie-metadata-frontend` Docker container using `oven/bun:alpine`.

---

## 10. Docker Compose & End-to-End Topology

The entire stack is declared in [`docker-compose.yml`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/docker-compose.yml):

| Service | Container Name | Image / Build | Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `movie-metadata-postgres` | `postgres:16.4-alpine` | `5425:5432` | Source of truth (1,000 movies, 14 classes, 50 subclasses) |
| **`metabase`** | `movie-metadata-metabase` | `metabase/metabase:v0.50.23` | `3000:3000` | Relational SQL dashboards & BI analytics |
| **`ontop`** | `movie-metadata-ontop` | `ontop/ontop:5.5.0` | `127.0.0.1:8080:8080` | SPARQL-to-SQL virtual knowledge graph engine |
| **`fastapi`** | `movie-metadata-fastapi` | Multi-stage Dockerfile (`uv`) | `127.0.0.1:8025:8025` | Secure REST API, AST validator, OmniRoute agent |
| **`frontend`** | `movie-metadata-frontend` | `oven/bun:alpine` (Vite) | `5125:5125` | React explorer web interface |

### Launching the Full Stack
```bash
# Build and start all 5 services in the background
docker compose up -d --build
```

### Accessing Services
- **Web Explorer UI:** [http://localhost:5125](http://localhost:5125)
- **FastAPI Interactive Docs:** [http://127.0.0.1:8025/docs](http://127.0.0.1:8025/docs)
- **Metabase BI:** [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database:** `localhost:5425` (`movies_db`)

# Movie Metadata Database: PostgreSQL & Metabase

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.4--alpine-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Metabase](https://img.shields.io/badge/Metabase-v0.50.23-509EE3?logo=metabase&logoColor=white)](https://www.metabase.com/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v2+-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

A fully functional, reproducible, Dockerized relational database environment demonstrating metadata-driven schema modeling, taxonomy hierarchies, and business intelligence reporting using **PostgreSQL** and **Metabase**.

The database manages a curated catalog of **exactly 1,000 distinct dummy movies**, structured through top-level **Classes** and granular **Subclasses**, with all taxonomic tokens governed by a **Unified Metadata Registry (`metaid`)** and defined within a formal **Definition** specification.

---

## Table of Contents

- [1. Architectural Overview](#1-architectural-overview)
- [2. Metadata Identifier Model (Resolution of `metaid`)](#2-metadata-identifier-model-resolution-of-metaid)
- [3. Entity-Relationship (ER) Diagram](#3-entity-relationship-er-diagram)
- [4. Foreign Key Relationships & Integrity Constraints](#4-foreign-key-relationships--integrity-constraints)
- [5. Database Schema & Core Tables](#5-database-schema--core-tables)
- [6. Data Generation & Seeding Methodology](#6-data-generation--seeding-methodology)
- [7. Analytical & Reporting SQL Views](#7-analytical--reporting-sql-views)
- [8. Docker Compose Architecture & Services](#8-docker-compose-architecture--services)
- [9. Step-by-Step Execution & Quickstart](#9-step-by-step-execution--quickstart)
- [10. Automated Validation & Test Suite](#10-automated-validation--test-suite)
- [11. Metabase Configuration & Dashboard Setup](#11-metabase-configuration--dashboard-setup)
- [12. Security & Role Hardening](#12-security--role-hardening)
- [13. Database Reset & Reseed Procedure](#13-database-reset--reseed-procedure)

---

## 1. Architectural Overview

Modern data platforms require flexible, metadata-driven architectures that can categorize diverse entities without requiring invasive schema refactoring whenever new genres, tags, or formats are introduced.

This project delivers a relational metadata architecture centered on four core tables:
1. `object`: Represents physical or logical entities (in this demonstration, feature movies).
2. `class`: Top-level taxonomy categories (e.g., *Action*, *Drama*, *Science Fiction*).
3. `subclass`: Granular, domain-specific subcategories (e.g., *Martial Arts*, *Space Opera*, *Detective*).
4. `definition`: Semantic metadata catalog specifying data types, descriptions, namespaces, and versioning for any metadata identifier.

A fifth foundational registry table, `metadata_registry`, enforces global taxonomic uniqueness and unifies the metadata identifier space.

---

## 2. Metadata Identifier Model (Resolution of `metaid`)

### Analysis of Architectural Options

When modeling metadata identifiers (`metaid`) across classes, subclasses, and objects, two primary designs exist:

| Criterion | Option A: Separate Category Identifiers | Option B: Unified Metadata Registry (Selected) |
|---|---|---|
| **Identifier Space** | Isolated sequences or keys per table | Globally unique, namespaced semantic tokens |
| **Referential Integrity** | Hard to enforce cross-table `definition` constraints | Single foreign key from all tables to registry |
| **Extensibility** | Adding new entity types requires new FK tables | New entity types simply register new tokens |
| **Collision Prevention** | Dependent on table-specific uniqueness | Guaranteed globally by primary key constraint |
| **Data Governance** | Fragmented metadata definitions | Centralized catalog in `definition` table |

### Adopted Decision: Option B (Unified Metadata Registry)

We implemented **Option B** to ensure strict referential integrity, eliminate identifier collision risks, and provide an extensible metadata backbone:

1. **`metadata_registry`**: Primary authority for all global tokens (`metaid`). Every category token belongs to a declared `entity_type` (`'class'`, `'subclass'`, or `'object'`).
2. **`class.metaid`**: Identifies the primary movie genre (e.g., `class:action`, `class:drama`). References `metadata_registry(metaid)`.
3. **`subclass.metaid`**: Identifies the specialized subgenre (e.g., `subclass:martial_arts`, `subclass:space_opera`). References `metadata_registry(metaid)`.
4. **`object.metaid`**: Identifies the **structural archetype / production format** of the movie object (e.g., `object:feature_film`, `object:documentary_feature`, `object:animated_feature`, `object:anthology_feature`). References `metadata_registry(metaid)`.
5. **`definition.metaid`**: Formally documents the meaning, data type, namespace, and version of any token in the registry.

### Semantics of `class`, `subclass`, and `metaid` in `object`

The three fields in `object` fulfill distinct, non-interchangeable roles:
- `class`: Specifies the top-level thematic classification.
- `subclass`: Specifies the granular sub-thematic specialization.
- `metaid`: Specifies the structural archetype of the entity itself.

### Identifier Quoting in PostgreSQL

In SQL-92 and PostgreSQL, `class` is an unreserved keyword (used in system catalog `pg_class`). To ensure cross-tool compatibility and prevent ambiguity, the column is quoted as `"class"` in DDL scripts. PostgreSQL stores unquoted identifiers in lowercase, allowing queries to reference `class` or `"class"` interchangeably.

---

## 3. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    METADATA_REGISTRY ||--o{ CLASS : "identifies (1:1)"
    METADATA_REGISTRY ||--o{ SUBCLASS : "identifies (1:1)"
    METADATA_REGISTRY ||--o{ DEFINITION : "defines (1:1)"
    METADATA_REGISTRY ||--o{ OBJECT : "classifies format (1:N)"
    
    CLASS ||--|{ SUBCLASS : "parents (1:N)"
    CLASS ||--o{ OBJECT : "categorizes (1:N)"
    SUBCLASS ||--o{ OBJECT : "specializes (1:N)"
    CLASS ||--|{ RELATION_CLASS_SUBCLASS : "class relationship (1:N)"
    SUBCLASS ||--|{ RELATION_CLASS_SUBCLASS : "subclass relationship (1:N)"

    METADATA_REGISTRY {
        varchar(64) metaid PK "Global unique identifier"
        varchar(32) entity_type "class | subclass | object"
        timestamptz created_at "Registration timestamp"
    }

    CLASS {
        varchar(64) metaid PK, FK "Ref metadata_registry"
        varchar(64) name UK "Unique class name"
        text description "Thematic overview"
        timestamptz created_at "Creation timestamp"
    }

    SUBCLASS {
        varchar(64) metaid PK, FK "Ref metadata_registry"
        varchar(64) class_metaid FK "Ref class.metaid"
        varchar(64) name "Subclass name"
        text description "Sub-thematic overview"
        timestamptz created_at "Creation timestamp"
    }

    RELATION_CLASS_SUBCLASS {
        bigserial relation_id PK "Surrogate primary key"
        varchar(64) class_metaid FK "Ref class.metaid"
        varchar(64) subclass_metaid FK "Ref subclass.metaid"
        varchar(64) relation_type "Taxonomic relationship type"
        text description "Semantic relationship details per row"
        timestamptz created_at "Creation timestamp"
    }

    DEFINITION {
        bigserial definition_id PK "Surrogate identifier"
        varchar(64) metaid FK "Ref metadata_registry"
        varchar(128) name "Human-readable concept name"
        varchar(32) entity_type "Domain entity type"
        text description "Technical & semantic specification"
        varchar(64) data_type "Physical or logical data type"
        varchar(64) namespace "Taxonomic namespace"
        varchar(16) version "Semantic version"
        timestamptz created_at "Creation timestamp"
        timestamptz updated_at "Modification timestamp"
    }

    OBJECT {
        bigserial object_id PK "Surrogate identifier"
        varchar(255) title "Movie title"
        integer release_year "Plausible year (1888-2100)"
        varchar(255) director "Director name"
        text description "Movie synopsis"
        varchar(64) class FK "Ref class.metaid"
        varchar(64) subclass FK "Ref subclass.metaid"
        varchar(64) metaid FK "Ref metadata_registry"
        integer runtime_minutes "Runtime (30-600 min)"
        numeric rating "IMDb-style score (1.0-10.0)"
        varchar(10) original_language "ISO language code"
        timestamptz created_at "Creation timestamp"
        timestamptz updated_at "Modification timestamp"
    }
```

---

## 4. Foreign Key Relationships & Integrity Constraints

Referential integrity is guaranteed through strict database constraints:

### 1. Composite Taxonomy Integrity (`fk_object_class_subclass`)
- **Problem**: A movie might be mistakenly assigned `class = 'class:action'` and `subclass = 'subclass:romantic_comedy'`, corrupting taxonomy data.
- **Solution**: The `subclass` table declares a composite unique constraint `UNIQUE (class_metaid, metaid)`. The `object` table declares:
  ```sql
  CONSTRAINT fk_object_class_subclass 
      FOREIGN KEY ("class", subclass) 
      REFERENCES subclass(class_metaid, metaid) 
      ON UPDATE CASCADE ON DELETE RESTRICT;
  ```
  **Result**: PostgreSQL's query planner mathematically rejects any movie record whose subclass does not belong to its designated class!

### 2. Explicit Relationship Modeling (`relation_class_subclass`)
- The `relation_class_subclass` table provides a dedicated, queryable mapping table explicitly defining how each class and subclass are related on a row-by-row basis.
- Enforces composite foreign key referencing `subclass(class_metaid, metaid)` and unique constraint `UNIQUE (class_metaid, subclass_metaid)` with surrogate primary key `relation_id`.

### 3. Orphan Protection (`ON DELETE RESTRICT`)
- Deleting an active `class` or `subclass` that has associated movies is blocked with an error. Existing movie records cannot be silently orphaned.

### 4. Cascading Updates (`ON UPDATE CASCADE`)
- If a metadata token identifier is standardized or migrated, all referencing records in `class`, `subclass`, and `object` automatically update in lockstep.

### 5. Definition Lifecycle (`ON DELETE CASCADE`)
- Removing a registered metadata concept removes its semantic specification in `definition`.

---

## 5. Database Schema & Core Tables

The schema is defined in [001_create_schema.sql](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/movie-metadata-db/sql/001_create_schema.sql):

| Table | Primary Key | Key Foreign Keys | Key Constraints |
|---|---|---|---|
| `metadata_registry` | `metaid` | *None* | `CHECK (entity_type IN ('class', 'subclass', 'object'))` |
| `class` | `metaid` | `metaid -> metadata_registry(metaid)` | `UNIQUE (name)` |
| `subclass` | `metaid` | `metaid -> metadata_registry(metaid)`<br>`class_metaid -> class(metaid)` | `UNIQUE (class_metaid, name)`<br>`UNIQUE (class_metaid, metaid)` |
| `relation_class_subclass` | `relation_id` | `class_metaid -> class(metaid)`<br>`subclass_metaid -> subclass(metaid)`<br>`(class_metaid, subclass_metaid) -> subclass(class_metaid, metaid)` | `UNIQUE (class_metaid, subclass_metaid)` |
| `definition` | `definition_id` | `metaid -> metadata_registry(metaid)` | `UNIQUE (metaid)`<br>`UNIQUE (metaid, namespace, version)` |
| `object` | `object_id` | `"class" -> class(metaid)`<br>`("class", subclass) -> subclass(class_metaid, metaid)`<br>`metaid -> metadata_registry(metaid)` | `CHECK (release_year BETWEEN 1888 AND 2100)`<br>`CHECK (rating BETWEEN 1.0 AND 10.0)`<br>`CHECK (runtime_minutes BETWEEN 30 AND 600)`<br>`UNIQUE (title, release_year)` |


### Indexes
To optimize Metabase filtering and foreign-key join operations:
- `idx_object_title`: B-tree index on movie titles for text searches.
- `idx_object_release_year`: Range scan index for chronological filtering.
- `idx_object_class` & `idx_object_subclass`: Foreign key lookup indexes.
- `idx_object_class_subclass`: Composite index supporting composite join resolution.
- `idx_object_metaid`: Object format filtering index.
- `idx_object_rating`: Numeric sorting index for top-rated queries.
- `idx_subclass_class_metaid`: Subclass parent navigation index.
- `idx_definition_namespace`: Metadata catalog scoping index.

---

## 6. Data Generation & Seeding Methodology

### Metadata Seeding ([002_seed_metadata.sql](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/movie-metadata-db/sql/002_seed_metadata.sql))
Populates:
- **14 Canonical Classes**: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Fantasy, Horror, Mystery, Romance, Science Fiction, Thriller, Western.
- **50 Specialized Subclasses**: Distributed across all 14 classes (e.g., *Martial Arts*, *Superhero*, *3D CGI*, *Anime*, *Romantic Comedy*, *Heist*, *Space Opera*, *Cyberpunk*, *Spaghetti Western*).
- **4 Object Formats**: Feature Film, Documentary Feature, Animated Feature, Anthology Feature.
- **68 Comprehensive Definitions**: Full definitions specifying data types (`taxonomy.class`, `taxonomy.subclass`, `entity.film.*`), namespaces (`movies.classes`, `movies.subclasses`, `movies.objects`), and semantic versions.

### 1,000 Movie Generator ([003_seed_movies.sql](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/movie-metadata-db/sql/003_seed_movies.sql))
Uses pure PostgreSQL native SQL (`generate_series(1, 1000)`):
- **Deterministic & Reproducible**: Uses prime modular arithmetic over fixed cinematic word banks. Every run generates the exact same 1,000 movies.
- **100% Unique Titles**: Generated from combinations of 50 cinematic prefixes, 50 atmospheric nouns, and 20 edition suffixes. Verified to produce zero title collisions.
- **Guaranteed Taxonomic Validity**: Subclasses are partitioned via window functions and assigned modulo `i`. Every movie's `class` is pulled directly from its selected `subclass`, strictly satisfying `fk_object_class_subclass`.
- **Even Distribution**: Each of the 50 subclasses contains exactly 20 movie records ($1000 / 50 = 20$).
- **Realistic Attributes**:
  - Release years range from 1955 to 2024.
  - Directors drawn from 50 world-renowned international filmmakers.
  - Ratings scaled realistically from 5.5 to 9.7.
  - Runtimes between 75 and 195 minutes.
  - Languages sampled across `en`, `fr`, `es`, `de`, `ja`, `it`, `ko`, `sv`, `pt`, `zh`.

---

## 7. Analytical & Reporting SQL Views

Created in [004_create_views.sql](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/movie-metadata-db/sql/004_create_views.sql):

### 1. `v_movie_catalog`
Denormalized, human-readable view for catalog browsing in Metabase.
```sql
SELECT title, release_year, director, class_name, subclass_name, rating, runtime_minutes 
FROM v_movie_catalog 
ORDER BY rating DESC LIMIT 5;
```

### 2. `v_movie_counts_by_class`
Aggregates movie count, average rating, rating bounds, and average runtime per class. Uses `LEFT JOIN` to guarantee classes with 0 records appear.

### 3. `v_movie_counts_by_subclass`
Aggregates movie count and average rating per subclass, preserving parent class hierarchy. Uses `LEFT JOIN` to include subclasses with 0 records.

### 4. `v_movie_metadata`
Inspectable taxonomic view linking each movie to complete semantic definitions across all taxonomy tiers (class, subclass, and object format).

---

## 8. Docker Compose Architecture & Services

The multi-container stack is defined in [docker-compose.yml](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/movie-metadata-db/docker-compose.yml):

```text
Host Network
  ├── Port 5432 ──> [postgres (PostgreSQL 16.4-alpine)]
  └── Port 3000 ──> [metabase (Metabase v0.50.23)]
                          │
  movie_metadata_network  │ (Internal connection: host=postgres, port=5432)
                          ▼
                    [postgres:5432]
```

### Services & Configurations

| Service | Pinned Image | Port Mapping | Storage Volume | Health Check |
|---|---|---|---|---|
| `postgres` | `postgres:16.4-alpine` | `5432:5432` | `movie_metadata_postgres_data` | `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}` |
| `metabase` | `metabase/metabase:v0.50.23` | `3000:3000` | `movie_metadata_metabase_data` | HTTP probe on `/api/health` |

### Initialization Pipeline (`/docker-entrypoint-initdb.d`)
When the PostgreSQL data volume is initialized for the first time, PostgreSQL executes all scripts mounted in `/docker-entrypoint-initdb.d/` in alphabetical order:
1. `001_create_schema.sql` (Creates tables, constraints, indexes, triggers)
2. `002_seed_metadata.sql` (Seeds registry, classes, subclasses, definitions)
3. `003_seed_movies.sql` (Generates exactly 1,000 distinct movie records)
4. `004_create_views.sql` (Deploys reporting and analytical views)
5. `005_validation.sql` (Executes automated verification suite during startup)

---

## 9. Step-by-Step Execution & Quickstart

### Prerequisites
- Docker Engine 24+ and Docker Compose v2+
- Git

### 1. Environment Configuration
Navigate to the project root and copy the example environment file:
```bash
cd movie-metadata-db
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Review `.env` and adjust passwords if needed:
```env
POSTGRES_DB=movies_db
POSTGRES_USER=movie_admin
POSTGRES_PASSWORD=dev_movie_master_secret_password_2026
POSTGRES_PORT=5432
METABASE_PORT=3000
TZ=UTC
```

### 2. Start Containers
Launch PostgreSQL and Metabase in the background:
```bash
docker compose up -d
```

### 3. Verify Health & Service Status
Check container status and health probes:
```bash
docker compose ps
```
Both services should transition to `healthy`:
```text
NAME                      IMAGE                      STATUS                   PORTS
movie-metadata-postgres   postgres:16.4-alpine       Up (healthy)             0.0.0.0:5432->5432/tcp
movie-metadata-metabase   metabase/metabase:v0.50.23 Up (healthy)             0.0.0.0:3000->3000/tcp
```

### 4. Inspect Container Logs
Follow initialization logs:
```bash
docker compose logs -f postgres
docker compose logs -f metabase
```

### 5. Connect to PostgreSQL via `psql`
Execute an interactive `psql` session inside the container:
```bash
docker compose exec -it postgres psql -U movie_admin -d movies_db
```

Or connect from your local host using any SQL client (DBeaver, TablePlus, DataGrip):
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `movies_db`
- **User**: `movie_admin`
- **Password**: *(from your `.env` file)*

### 6. Run SQL Validation Manually
Execute the automated test suite at any time:
```bash
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/005_validation.sql
```

### 7. Stop Containers Without Losing Data
```bash
docker compose down
```
Data remains safely persisted in the named Docker volumes. To restart:
```bash
docker compose up -d
```

---

## 10. Automated Validation & Test Suite

The validation script [005_validation.sql](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/movie-metadata-db/sql/005_validation.sql) executes 10 automated assertions inside a transaction block, raising a runtime `EXCEPTION` if any check fails:

1. **Exact Count**: Asserts that `COUNT(*)` in `object` is exactly 1,000.
2. **Key Uniqueness**: Asserts that `COUNT(DISTINCT object_id)` is 1,000.
3. **Title Distinctness**: Asserts that `COUNT(DISTINCT title)` is 1,000.
4. **Mandatory Fields**: Asserts 0 nulls across all required columns.
5. **Class Referential Integrity**: Asserts 0 orphaned class references.
6. **Subclass Referential Integrity**: Asserts 0 orphaned subclass references.
7. **Taxonomic Hierarchy Integrity**: Asserts 0 movies whose subclass belongs to a different class.
8. **Metadata Definition Coverage**: Asserts that all object `metaid` values have corresponding registered definitions.
9. **Namespace Uniqueness**: Asserts zero duplicate metadata identifiers within the taxonomy namespaces.
10. **View Consistency**: Asserts that `v_movie_catalog` returns 1,000 rows and aggregated sums in `v_movie_counts_by_class` and `v_movie_counts_by_subclass` equal 1,000.

### Example 4-Table Relational Join Query
```sql
SELECT 
    o.object_id,
    o.title,
    o.release_year,
    o.director,
    o.rating,
    c.name AS class_name,
    sc.name AS subclass_name,
    obj_def.name AS object_archetype
FROM object o
JOIN class c 
    ON o."class" = c.metaid
JOIN subclass sc 
    ON o.subclass = sc.metaid AND o."class" = sc.class_metaid
JOIN definition obj_def 
    ON o.metaid = obj_def.metaid
ORDER BY o.rating DESC
LIMIT 5;
```

---

## 11. Metabase Configuration & Dashboard Setup

### Connecting Metabase to PostgreSQL

1. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```
2. Complete the initial Metabase onboarding wizard (choose your language and create an administrator account).
3. On the **"Add your data"** step (or via **Admin Settings > Databases > Add a database**), input:
   - **Database type**: `PostgreSQL`
   - **Display name**: `Movie Metadata Warehouse`
   - **Host**: `postgres`  *(CRITICAL: Use the Docker Compose service name, NOT `localhost`)*
   - **Port**: `5432`
   - **Database name**: `movies_db` *(or matching your `.env` value)*
   - **Username**: `movie_admin` *(or read-only role `metabase_ro`)*
   - **Password**: *(matching your `.env` value)*
4. Click **Save**. Metabase will immediately scan the schema and sync tables and views.

### Recommended Starter Dashboard

Build a visualization dashboard in Metabase using the pre-built reporting views:

| Card # | Question / Visualization Title | Source Table / View | Visualization Type | Metric / Settings |
|---|---|---|---|---|
| **1** | **Total Movie Catalog Size** | `v_movie_catalog` | **Number (Scalar)** | Count of rows (`1,000`) |
| **2** | **Movie Distribution by Class** | `v_movie_counts_by_class` | **Bar / Donut Chart** | X-axis: `class_name`, Y-axis: `movie_count` |
| **3** | **Detailed Distribution by Subclass** | `v_movie_counts_by_subclass` | **Horizontal Bar Chart** | X-axis: `movie_count`, Y-axis: `subclass_name`, Group by `class_name` |
| **4** | **Movies Released by Year** | `v_movie_catalog` | **Line / Trend Chart** | X-axis: `release_year`, Y-axis: Count |
| **5** | **Average Critic Rating by Class** | `v_movie_counts_by_class` | **Bar Chart** | X-axis: `class_name`, Y-axis: `avg_rating` (Goal line at 7.5) |
| **6** | **Top 10 Highest Rated Movies** | `v_movie_catalog` | **Table View** | Filter: Top 10 sorted by `rating` DESC |
| **7** | **Film Runtime Distribution** | `v_movie_catalog` | **Histogram** | Bin: `runtime_minutes` (15 min intervals) |
| **8** | **Interactive Movie Explorer** | `v_movie_catalog` | **Table with Filters** | Dashboard filter dropdowns connected to `class_name` and `subclass_name` |

---

## 12. Security & Role Hardening

### Local Development vs Production

| Feature | Local Development Default | Production Recommendation |
|---|---|---|
| **PostgreSQL Port** | Exposed on host `5432` | Remove host port binding; access only via Docker overlay network |
| **Metabase App DB** | Embedded H2 (`/metabase-data/metabase.db`) | Dedicated production PostgreSQL application database (`MB_DB_TYPE=postgres`) |
| **Database Credentials** | Stored in local `.env` | Inject via Docker Secrets, AWS Secrets Manager, or HashiCorp Vault |
| **Database Role** | Administrative `movie_admin` | Dedicated read-only role (`metabase_ro`) for Metabase connection |

### Creating a Dedicated Read-Only Role for Metabase

To follow the principle of least privilege, create a read-only role in PostgreSQL for Metabase:

```sql
-- Connect as movie_admin and run:
CREATE ROLE metabase_ro WITH LOGIN PASSWORD 'SecureReadOnlyPassword2026!';

-- Grant connect and schema usage
GRANT CONNECT ON DATABASE movies_db TO metabase_ro;
GRANT USAGE ON SCHEMA public TO metabase_ro;

-- Grant SELECT only on tables and views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO metabase_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metabase_ro;
```

---

## 13. Database Reset & Reseed Procedure

> [!CAUTION]
> The reset procedure permanently destroys all data inside the Docker volumes `movie_metadata_postgres_data` and `movie_metadata_metabase_data`. All movie records, custom Metabase dashboards, and question histories will be deleted and reseeded from scratch.

### Linux / macOS / WSL (Bash)
```bash
./scripts/reset_database.sh
```
*(To bypass interactive confirmation in automated scripts, use `./scripts/reset_database.sh -f`)*

### Windows (PowerShell)
```powershell
.\scripts\reset_database.ps1
```
*(To bypass interactive confirmation, use `.\scripts\reset_database.ps1 -Force`)*

### Manual Step-by-Step Reset
If you prefer running commands manually:
```bash
# 1. Stop containers and destroy persisted volumes
docker compose down -v --remove-orphans

# 2. Re-create and restart containers (triggers /docker-entrypoint-initdb.d)
docker compose up -d

# 3. Wait for PostgreSQL to become healthy
docker compose ps

# 4. Verify reseeded data
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/005_validation.sql
```

---

## 14. Applying Migrations on Existing Volumes

The SQL initialization scripts in `/docker-entrypoint-initdb.d/` only execute automatically when the PostgreSQL data directory is completely empty. If you modify SQL scripts after the database is already running, apply them manually using:

```bash
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/001_create_schema.sql
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/002_seed_metadata.sql
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/003_seed_movies.sql
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/004_create_views.sql
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/005_validation.sql
```
All DDL and seed scripts use idempotent constructs (`CREATE ... IF NOT EXISTS`, `CREATE OR REPLACE VIEW`, and `ON CONFLICT (...) DO UPDATE`), ensuring they are safe to execute against an existing database.

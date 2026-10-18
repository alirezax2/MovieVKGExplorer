# PostgreSQL Relational Metadata Database with Docker Compose and Metabase

## 1. Role and Objective

Act as a senior database architect, PostgreSQL engineer, data modeler, and DevOps engineer.

Build a fully functional, reproducible, Dockerized relational database environment using **PostgreSQL and Metabase**. Design a metadata-driven relational schema for movies, create and execute the SQL schema, and populate the database with exactly 1,000 realistic dummy movie records.

The primary objective is to demonstrate how objects can be categorized using classes and subclasses, with metadata definitions associated with their `metaid` identifiers.

The result must be executable, documented, and easy to extend with additional object types and metadata categories in the future.

## 2. Technology Stack

Use the following technologies:

- **Docker Compose:** Container orchestration.
- **PostgreSQL:** Primary relational database.
- **Metabase:** Business intelligence, database exploration, SQL queries, and dashboard visualization.
- **SQL:** Schema creation, constraints, indexes, views, and data seeding.
- **Python (optional):** Only if useful for generating reproducible dummy data. Prefer PostgreSQL-native SQL for straightforward data generation.

Use official or trusted stable Docker images. Pin explicit image versions rather than relying on `latest`.

Do not introduce unnecessary services, databases, graph databases, or application frameworks.

## 3. Required Deliverables

Create a complete project with the following structure:

```text
movie-metadata-db/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── sql/
│   ├── 001_create_schema.sql
│   ├── 002_seed_metadata.sql
│   ├── 003_seed_movies.sql
│   ├── 004_create_views.sql
│   └── 005_validation.sql
└── scripts/
    └── reset_database.sh
```

Adjust the structure only when there is a clear technical reason.

All files must contain complete, executable implementations rather than placeholders or pseudocode.

## 4. Docker Compose Requirements

Create a `docker-compose.yml` with two services.

### Service A: PostgreSQL

Requirements:

- Use an explicit PostgreSQL image version.
- Configure the database name, username, and password through environment variables.
- Persist database files in a named Docker volume.
- Expose PostgreSQL on a configurable host port, defaulting to `5432`.
- Include a health check using `pg_isready`.
- Configure restart behavior.
- Initialize the database schema and seed data automatically on the first initialization of an empty data volume.
- Mount the SQL initialization scripts in the correct execution order.
- Support configurable timezone and database settings where appropriate.

### Service B: Metabase

Requirements:

- Use the official Metabase Docker image with a pinned version.
- Persist Metabase application state in a named volume.
- Configure its application database appropriately. For a simple local demonstration, the embedded application database is acceptable; clearly distinguish it from the PostgreSQL database containing the movie data.
- Wait for PostgreSQL to become healthy before starting dependent initialization or configuration workflows where practical.
- Expose Metabase on host port `3000`.
- Configure restart behavior and a health check if supported by the selected image.
- Document how to connect Metabase to the PostgreSQL movie database.

The application must be accessible at:

`http://localhost:3000`

PostgreSQL must be accessible through a database client at:

`localhost:5432`

Use a `.env.example` file and explain how to copy it to `.env`. Do not commit real credentials.

## 5. Relational Database Design

Design the schema in PostgreSQL using a metadata-driven relational model.

The database must contain these four core tables:

1. `object`
2. `class`
3. `subclass`
4. `definition`

Use consistent naming conventions, primary keys, foreign keys, unique constraints, and appropriate indexes.

### 5.1. Object table

Create a table named `object` representing individual movies.

Required columns:

| Column | Purpose |
|---|---|
| `object_id` | Primary key identifying each movie record |
| `title` | Movie title |
| `release_year` | Release year |
| `director` | Director's name |
| `description` | Short movie description |
| `class` | Class metadata identifier |
| `subclass` | Subclass metadata identifier |
| `metaid` | Metadata identifier for the object |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

Add additional useful movie attributes, such as runtime, rating, and original language, if appropriate.

**Important:** The columns named `class`, `subclass`, and `metaid` are intentional requirements. Preserve these names in the logical schema. If quoted identifiers are necessary, document the implications. Prefer a design that minimizes the need for quoted identifiers.

Define the following semantics:

- `class`: identifies the movie's primary category, such as Drama, Comedy, Action, or Documentary.
- `subclass`: identifies a more specific category within the class, such as Crime Drama, Romantic Comedy, or Science Fiction.
- `metaid`: identifies the metadata type or concept associated with the object, according to the final metadata model.

Do not treat these three fields as interchangeable.

### 5.2. Class table

Create a table named `class` to define the top-level movie categories.

Required columns:

| Column | Purpose |
|---|---|
| `metaid` | Primary key identifying the class metadata entry |
| `name` | Class name |
| `description` | Class description |
| `created_at` | Creation timestamp |

Populate it with meaningful movie categories, for example:

- Action
- Adventure
- Animation
- Comedy
- Crime
- Documentary
- Drama
- Fantasy
- Horror
- Mystery
- Romance
- Science Fiction
- Thriller
- Western

Add unique constraints where appropriate.

### 5.3. Subclass table

Create a table named `subclass` for more specific categories.

Required columns:

| Column | Purpose |
|---|---|
| `metaid` | Primary key identifying the subclass metadata entry |
| `class_metaid` | Foreign key referencing `class.metaid` |
| `name` | Subclass name |
| `description` | Subclass description |
| `created_at` | Creation timestamp |

Examples:

- Action → Martial Arts
- Action → Superhero
- Comedy → Romantic Comedy
- Crime → Detective
- Crime → Gangster
- Drama → Historical Drama
- Science Fiction → Space Opera
- Thriller → Psychological Thriller

Each subclass must belong to a valid class. Prevent duplicate subclass names within the same class where appropriate.

### 5.4. Definition table

Create a table named `definition` to describe metadata identifiers and their meanings.

Required columns:

| Column | Purpose |
|---|---|
| `definition_id` | Primary key |
| `metaid` | Metadata identifier being defined |
| `name` | Human-readable metadata name |
| `entity_type` | Entity type, such as class, subclass, or object |
| `description` | Definition of the metadata concept |
| `data_type` | Expected data type or value type |
| `namespace` | Logical namespace for the metadata |
| `version` | Definition version |
| `created_at` | Creation timestamp |
| `updated_at` | Last modification timestamp |

Create suitable uniqueness constraints for the metadata identifier and namespace or entity type, depending on the chosen design.

The table must contain definitions for the class and subclass metadata identifiers and the object metadata identifier or identifiers used by the sample data.

Explain how metadata definitions are referenced, how identifiers are generated, and how referential integrity is maintained.

## 6. Resolve the Metadata Identifier Design Before Implementing

The schema must be internally consistent. Before writing SQL, explicitly resolve the semantics of `metaid`.

There are two possible interpretations:

**Option A — Separate category identifiers**

- `class.metaid` identifies a class.
- `subclass.metaid` identifies a subclass.
- `object.metaid` identifies an object metadata concept or type.
- `definition.metaid` identifies the concept being defined.

Under this model, the `class` and `subclass` columns in `object` reference the respective tables, and `object.metaid` references a valid object metadata definition. Because the identifiers belong to different domains, their relationships must be enforced through suitable constraints or a unified metadata registry.

**Option B — Unified metadata registry**

Create a shared metadata identifier registry, where every metadata concept has a globally unique `metaid`. The class, subclass, and definition tables reference that registry. A subclass additionally references its parent class, and each object references its selected class and subclass.

This model is more extensible when additional entity types and metadata concepts will be added in the future, but it introduces an additional table beyond the four required core tables.

**Preferred approach:** Use Option B if it can be implemented cleanly without making the demonstration unnecessarily complex. Preserve all four required core tables and the required `object.class`, `object.subclass`, and `object.metaid` columns.

If you choose Option A, explain how global identifier collisions are prevented and how referential integrity is enforced.

Do not implement ambiguous or contradictory foreign keys. Document the final decision in the README.

## 7. Foreign-Key Relationships

Implement and document the relationships between the tables.

At minimum, ensure that:

- Each movie references a valid class.
- Each movie references a valid subclass.
- Each subclass belongs to a valid parent class.
- Each required metadata definition references a valid metadata identifier.
- A movie's subclass belongs to the same class referenced by that movie.
- Metadata identifiers remain stable and unambiguous.
- Deleting a category cannot silently orphan existing movie records.

Use appropriate `ON DELETE` and `ON UPDATE` behaviors.

Consider composite foreign keys where needed to ensure that a movie cannot reference a subclass belonging to a different class.

Include an ER diagram in Mermaid syntax in the README.

## 8. Seed Metadata

Write `002_seed_metadata.sql` to populate the metadata tables.

Requirements:

- Create a realistic set of movie classes.
- Create multiple subclasses for each applicable class.
- Ensure all subclass-to-class relationships are valid.
- Populate the definition table with meaningful metadata definitions.
- Include descriptions for all seeded categories.
- Use deterministic IDs or stable keys so that relationships remain reproducible.
- Make the seed process idempotent where practical, using suitable `ON CONFLICT` handling.

Provide enough categories and subclasses to make the database useful for demonstrating relational joins and metadata queries.

## 9. Generate Exactly 1,000 Dummy Movies

Write `003_seed_movies.sql` to insert exactly 1,000 distinct dummy movie records.

Requirements:

- Generate exactly 1,000 records on an initial database setup.
- Use realistic, human-readable movie titles.
- Give each movie a plausible release year.
- Generate varied directors, descriptions, runtimes, ratings, and languages.
- Assign valid classes and subclasses.
- Ensure every subclass belongs to the movie's assigned class.
- Assign valid `metaid` values according to the chosen metadata model.
- Avoid invalid or orphaned foreign-key references.
- Ensure required columns are populated.
- Ensure movie titles or other natural keys follow the chosen uniqueness policy.
- Use deterministic generation so the same initial seed produces reproducible data.
- Avoid external APIs and downloads.

Prefer SQL-based generation using PostgreSQL features such as `generate_series()` and deterministic selection from seeded metadata.

Do not create 1,000 duplicate copies of a small fixed set of rows. Generate varied records with distinct titles and meaningful attribute combinations.

Make the seeding process safe to rerun without unintentionally creating duplicate movie records. Document how to reset the environment when a clean reseed is required.

## 10. Useful SQL Views

Write `004_create_views.sql` and create at least the following views:

### `v_movie_catalog`

A denormalized read-friendly view containing:

- Movie ID
- Title
- Release year
- Director
- Class name
- Subclass name
- Metadata identifier
- Definition name and description where applicable
- Rating and runtime

### `v_movie_counts_by_class`

Shows the number of movies in each class, including categories with zero movies.

### `v_movie_counts_by_subclass`

Shows the number of movies in each subclass, including categories with zero movies.

### `v_movie_metadata`

Provides an inspectable representation of movies and their associated metadata definitions.

Ensure that the views use correct joins and do not multiply rows unexpectedly.

## 11. Indexing and Database Quality

Create appropriate indexes for:

- Movie titles.
- Release years.
- Class references.
- Subclass references.
- Metadata identifiers.
- Frequently joined foreign-key columns.

Use primary keys, unique constraints, foreign keys, `NOT NULL`, and `CHECK` constraints where appropriate.

Consider adding:

- A rating range constraint.
- A plausible release-year constraint.
- A positive runtime constraint.
- A controlled vocabulary or validation mechanism for `entity_type`.

Do not over-index the small demonstration database. Explain the purpose of each nontrivial index.

## 12. Metabase Configuration and Demonstration

Document how to connect Metabase to PostgreSQL.

Provide:

- The hostname and port to use from Metabase's container network.
- The database name and credentials, sourced from environment variables.
- The schema containing the movie tables.
- Instructions for synchronizing the database schema in Metabase.
- Recommended saved questions and dashboard visualizations.

Important: From inside the Metabase container, the PostgreSQL hostname should be the Docker Compose service name, not `localhost`.

Recommend a starter dashboard with:

1. Total number of movies.
2. Movies by class.
3. Movies by subclass.
4. Movies by release year.
5. Average rating by class.
6. Top-rated movies.
7. Distribution of runtime.
8. Movie catalog table with class and subclass filters.

Use the views to simplify reporting where appropriate.

## 13. Validation and Automated Tests

Write `005_validation.sql` to verify that the database is correct.

The validation script must check:

- Exactly 1,000 movie records exist after initial seeding.
- Movie IDs are unique.
- All required movie fields are populated.
- No invalid class references exist.
- No invalid subclass references exist.
- No movie uses a subclass belonging to another class.
- All required metadata definitions exist.
- No unexpected duplicate metadata identifiers exist within the relevant namespace.
- All views return valid results.
- Aggregated counts are consistent with the underlying movie records.

Return readable validation results and raise an error or otherwise clearly fail validation if critical requirements are not met.

Include example SQL queries that demonstrate joins across all four core tables.

## 14. Security and Configuration

Follow sensible local-development security practices:

- Store credentials in `.env`.
- Include `.env.example` with placeholder values only.
- Add `.env` to `.gitignore`.
- Do not hardcode passwords in SQL scripts.
- Do not expose PostgreSQL publicly beyond the intended local-development interface.
- Explain how to create a read-only PostgreSQL role for Metabase if write access is unnecessary.
- Ensure Metabase's reporting role has only the permissions it needs.
- Do not expose database credentials in the README or logs.

Clearly distinguish development defaults from production recommendations.

## 15. Execution Instructions

The README must include exact commands for:

1. Creating the project files.
2. Configuring environment variables.
3. Starting the containers.
4. Checking service health.
5. Viewing container logs.
6. Connecting to PostgreSQL.
7. Running SQL validation.
8. Opening Metabase.
9. Connecting Metabase to PostgreSQL.
10. Stopping the containers.
11. Restarting without losing data.
12. Resetting the database and reseeding all data.

Include commands such as:

```bash
docker compose up -d
docker compose ps
docker compose logs -f postgres
docker compose logs -f metabase
```

Provide a command to connect to PostgreSQL with `psql` from inside the container.

Explain that the SQL initialization directory is executed automatically only when PostgreSQL initializes a new, empty data directory. Existing persistent volumes will not automatically rerun modified initialization scripts.

Explain how to execute migrations or SQL scripts against an already initialized database.

**Warning:** The reset procedure must explicitly warn that removing the PostgreSQL volume permanently deletes its stored data.

## 16. Acceptance Criteria

The task is complete only when all of the following are satisfied:

- [ ] Docker Compose starts PostgreSQL and Metabase successfully.
- [ ] Both services remain functional after a container restart.
- [ ] PostgreSQL uses persistent storage.
- [ ] Metabase is accessible at `http://localhost:3000`.
- [ ] All four required core tables exist.
- [ ] The `object` table contains the required `class`, `subclass`, and `metaid` columns.
- [ ] Foreign keys and constraints enforce the intended metadata relationships.
- [ ] Exactly 1,000 distinct movie records are inserted on initial setup.
- [ ] All movies have valid class and subclass assignments.
- [ ] The definition table contains meaningful metadata definitions.
- [ ] All required views exist and return correct results.
- [ ] SQL validation completes successfully.
- [ ] Metabase can connect to PostgreSQL and visualize the movie data.
- [ ] All project files and setup instructions are complete.
- [ ] The README documents the ER diagram, metadata design decisions, and reset procedure.

## 17. Required Implementation Workflow

Follow this sequence:

1. Explain the proposed relational model and resolve the meaning of `metaid`.
2. Present the ER diagram and explain each foreign-key relationship.
3. Implement the Docker Compose configuration and environment example.
4. Write the schema SQL.
5. Write metadata seed SQL.
6. Write SQL to generate exactly 1,000 movies.
7. Create the reporting views.
8. Create the validation SQL.
9. Write the README and reset script.
10. Run or provide reproducible commands for all validation checks.
11. Review all files for naming consistency, SQL execution order, foreign-key correctness, and Docker networking issues.
12. Report any tests that could not actually be executed rather than claiming they passed.

Deliver the complete contents of every required file. Do not stop after presenting an architecture or a partial SQL example.

The final result must be a working, extensible relational metadata database demonstration, not merely a conceptual design.




make additional table anme relation_class_subclass how class and subclass are related to each other for each row. use primary key if needed.


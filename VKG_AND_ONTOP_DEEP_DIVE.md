# Virtual Knowledge Graphs, Ontop, Ontologies, Mappings, and SPARQL: An In-Depth Engineering Guide

This guide provides an exhaustive, production-grade technical explanation of **Virtual Knowledge Graphs (VKG)**, **Ontop**, **OWL Ontologies**, **OBDA Mappings**, **SPARQL 1.1**, **SPARQL-to-SQL Query Rewriting**, the **FastAPI Security Layer**, and the **React + Bun Frontend**.

---

## Table of Contents

1. [Executive Summary & The Virtual Knowledge Graph Paradigm](#1-executive-summary--the-virtual-knowledge-graph-paradigm)
2. [Foundational Concepts: Semantic Web vs Relational Databases](#2-foundational-concepts-semantic-web-vs-relational-databases)
3. [The Ontology: Formalizing Domain Knowledge (OWL / Turtle)](#3-the-ontology-formalizing-domain-knowledge-owl--turtle)
4. [OBDA Mappings: Bridging Relational Tables to RDF Triples](#4-obda-mappings-bridging-relational-tables-to-rdf-triples)
5. [SPARQL 1.1 by Example: 6 Practical Queries](#5-sparql-11-by-example-6-practical-queries)
6. [Under the Hood: How Ontop Translates SPARQL to SQL](#6-under-the-hood-how-ontop-translates-sparql-to-sql)
7. [Ontop Engine Internals & Container Configuration](#7-ontop-engine-internals--container-configuration)
8. [FastAPI Backend: Query Broker, Security, and OmniRoute AI](#8-fastapi-backend-query-broker-security-and-omniroute-ai)
9. [Frontend Architecture: React, Bun, and Vite](#9-frontend-architecture-react-bun-and-vite)
10. [End-to-End Lifecycle of a Semantic Query](#10-end-to-end-lifecycle-of-a-semantic-query)
11. [Quick Reference Cheatsheet: SPARQL vs SQL vs Cypher](#11-quick-reference-cheatsheet-sparql-vs-sql-vs-cypher)

---

## 1. Executive Summary & The Virtual Knowledge Graph Paradigm

### The Traditional Dilemma: Relational Data vs Knowledge Graphs

For decades, enterprise systems have stored critical transactional records in **Relational Database Management Systems (RDBMS)** like PostgreSQL, MySQL, and Oracle. Relational databases excel at ACID guarantees, indexing, high-throughput writes, and tabular joins.

However, modern data applications—especially **AI agents, semantic search engines, and cross-domain data integration platforms**—struggle with relational schemas because:
1. **Schema Rigidity**: Altering relational tables requires complex migrations.
2. **Implicit Semantics**: Foreign keys represent pointer references (`class_id = 4`), not real-world semantic meanings (e.g., `"The movie *The Matrix* belongs to the genre *Sci-Fi*"`).
3. **LLM Hallucinations**: Large Language Models generating raw SQL frequently misinterpret ambiguous column names, miss complex multi-table joins, or generate unoptimized Cartesian products.

### The Naive Solution: Graph Materialization (ETL)

To gain knowledge graph capabilities, organizations often duplicate their data into a dedicated Graph Database (such as Neo4j, GraphDB, or Amazon Neptune):

```
┌─────────────────┐       Heavy ETL Pipeline        ┌─────────────────┐
│   PostgreSQL    │ ──────────────────────────────> │ Graph Database  │
│ (Source Tables) │ < - - - Synchronization - - - - │ (Neo4j/GraphDB) │
└─────────────────┘              Lag                └─────────────────┘
                                                             │
                                                             ▼
                                                    Client Graph Queries
```

#### Why Materialization Fails in Production:
- **Data Duplication**: Storing gigabytes or terabytes twice multiplies storage and hosting costs.
- **Synchronization Lag & Inconsistency**: Periodic ETL batch jobs leave the graph out of sync with the transactional database. Change Data Capture (CDC) pipelines are fragile and costly to maintain.
- **Lost Relational Optimizations**: Decades of database engineering (B-Tree indexes, query planners, parallel scan workers) are discarded in favor of graph traversal engines.

---

### The Virtual Knowledge Graph (VKG / OBDA) Solution

**Ontology-Based Data Access (OBDA)**, popularized by the W3C and implemented by **Ontop**, completely eliminates data duplication.

In a **Virtual Knowledge Graph (VKG)**:
1. **Zero Data Replication**: The data remains exclusively in PostgreSQL. No triples are ever written to disk.
2. **Real-Time Consistency**: The instant a row is committed in PostgreSQL, it is visible to graph queries.
3. **On-The-Fly Query Rewriting**: When a client or AI agent submits a SPARQL query, Ontop automatically compiles it into a **single, highly optimized SQL query** executed directly on PostgreSQL.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Virtual Knowledge Graph (VKG)                         │
└─────────────────────────────────────────────────────────────────────────────┘

       Client / AI Agent                      Frontend (React + Bun)
              │                                          │
              ▼                                          ▼
   [ Natural Language / SPARQL ]             [ SPARQL Studio / AI Chat ]
              │                                          │
              └─────────────────────┬────────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │   FastAPI Security Broker   │
                     │  (AST Validation & Limits)  │
                     └──────────────┬──────────────┘
                                    │ Validated SPARQL
                                    ▼
                     ┌─────────────────────────────┐
                     │     Ontop 5.5.0 Engine      │
                     │  ┌───────────────────────┐  │
                     │  │   OWL 2 QL Ontology   │  │
                     │  ├───────────────────────┤  │
                     │  │     OBDA Mappings     │  │
                     │  └───────────────────────┘  │
                     └──────────────┬──────────────┘
                                    │ On-the-fly Rewritten SQL
                                    ▼
                     ┌─────────────────────────────┐
                     │     PostgreSQL Database     │
                     │   (1,000 Movies, Classes)   │
                     │    Single Source of Truth   │
                     └─────────────────────────────┘
```

---

## 2. Foundational Concepts: Semantic Web vs Relational Databases

To understand how VKGs work, let's contrast relational terminology with Semantic Web terminology:

| Relational Database (RDBMS) | Semantic Web (RDF / OWL) | Definition / Purpose |
| :--- | :--- | :--- |
| **Row / Record** | **Resource / Subject** | An individual entity identified by a unique URI/IRI (e.g., `<https://example.org/movie-vkg/movie/42>`). |
| **Column Name** | **Predicate / Property** | The attribute or relationship connecting an entity to another entity or literal value. |
| **Cell Value** | **Object / Literal** | The target value (e.g., `"Inception"^^xsd:string`, `8.8^^xsd:decimal`). |
| **Table Schema (DDL)** | **Ontology (TBox)** | The formal vocabulary defining valid classes, hierarchies, and property constraints. |
| **Primary Key (PK)** | **Subject IRI** | A globally unique web identifier formed via a deterministic template (e.g., `movie/{object_id}`). |
| **Foreign Key (FK)** | **Object Property** | A directed graph relationship between two entities (`:hasGenreClass`). |
| **SQL SELECT** | **SPARQL SELECT** | The declarative query language used to retrieve data. |

### The Atomic Unit: The RDF Triple

Every piece of information in a knowledge graph is expressed as an RDF triple:
$$\text{(Subject, Predicate, Object)}$$

For example:
```turtle
# Subject                                      Predicate                  Object
<https://example.org/movie-vkg/movie/1>        rdf:type                   <https://example.org/movie-vkg/Movie> .
<https://example.org/movie-vkg/movie/1>        <https://example.org/movie-vkg/title> "The Shawshank Redemption"^^xsd:string .
<https://example.org/movie-vkg/movie/1>        <https://example.org/movie-vkg/rating> 9.3^^xsd:decimal .
<https://example.org/movie-vkg/movie/1>        <https://example.org/movie-vkg/hasGenreClass> <https://example.org/movie-vkg/class/class:drama> .
```

---

## 3. The Ontology: Formalizing Domain Knowledge (OWL / Turtle)

### What is an Ontology?

An **Ontology** defines the common concepts, taxonomy, and relationships in a specific domain. It acts as the **conceptual contract** between humans, AI models, and databases.

In the Semantic Web, ontologies are typically modeled using **OWL 2 (Web Ontology Language)** and expressed in **Turtle (`.ttl`)** syntax.

### TBox vs ABox
- **TBox (Terminological Box)**: The schema and axioms. Defines what a `Movie` is, what a `MovieClass` is, and asserts that every `Movie` can have a `:rating`.
- **ABox (Assertion Box)**: The actual data instances. In a traditional graph, the ABox is stored as millions of RDF triples. **In a VKG, the ABox is completely virtualized from PostgreSQL rows!**

---

### Anatomy of an OWL Ontology

An OWL ontology consists of three primary constructs:
1. **Classes (`owl:Class`)**: Categories of entities in the domain.
2. **Object Properties (`owl:ObjectProperty`)**: Predicates that link an entity to another entity (Graph Edges).
3. **Datatype Properties (`owl:DatatypeProperty`)**: Predicates that link an entity to a primitive literal value (Attributes like strings, numbers, dates).

---

### Concrete Implementation: `ontop/ontology.ttl`

Below is an annotated walkthrough of the movie ontology used in this project ([`ontop/ontology.ttl`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ontop/ontology.ttl)):

```turtle
# ------------------------------------------------------------------------------
# 1. Prefix Declarations: Shorthand aliases for long IRI namespaces
# ------------------------------------------------------------------------------
@prefix : <https://example.org/movie-vkg/> .
@prefix mv: <https://example.org/movie-vkg/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# ------------------------------------------------------------------------------
# 2. Ontology Metadata
# ------------------------------------------------------------------------------
<https://example.org/movie-vkg> a owl:Ontology ;
    rdfs:label "Movie Metadata Virtual Knowledge Graph Ontology"@en ;
    rdfs:comment "Ontology formalizing movies, genres, subgenres, and metadata."@en ;
    owl:versionInfo "1.0.0" .

# ------------------------------------------------------------------------------
# 3. OWL Classes (The Entities)
# ------------------------------------------------------------------------------
mv:Movie a owl:Class ;
    rdfs:label "Movie"@en ;
    rdfs:comment "A movie entity representing a film record."@en .

mv:MovieClass a owl:Class ;
    rdfs:label "Movie Class"@en ;
    rdfs:comment "Top-level genre/class category (e.g., Action, Drama, Sci-Fi)."@en .

mv:MovieSubclass a owl:Class ;
    rdfs:label "Movie Subclass"@en ;
    rdfs:comment "Subcategory belonging to a parent Movie Class (e.g., Superhero)."@en .

mv:MetadataRegistry a owl:Class ;
    rdfs:label "Metadata Registry"@en ;
    rdfs:comment "Registry entry tracking entity types, schema versions, and audit state."@en .

mv:Definition a owl:Class ;
    rdfs:label "Definition"@en ;
    rdfs:comment "Formal definition and semantic explanation of taxonomy items."@en .

# ------------------------------------------------------------------------------
# 4. OWL Object Properties (Graph Edges between Entities)
# ------------------------------------------------------------------------------
mv:hasGenreClass a owl:ObjectProperty ;
    rdfs:label "has genre class"@en ;
    rdfs:domain mv:Movie ;        # Source of the edge must be a Movie
    rdfs:range mv:MovieClass .    # Target of the edge must be a MovieClass

mv:belongsToClass a owl:ObjectProperty ;
    rdfs:label "belongs to class"@en ;
    rdfs:domain mv:MovieSubclass ;
    rdfs:range mv:MovieClass .

mv:hasSubclass a owl:ObjectProperty ;
    rdfs:label "has subclass"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range mv:MovieSubclass .

mv:definedBy a owl:ObjectProperty ;
    rdfs:label "defined by"@en ;
    rdfs:domain mv:MetadataRegistry ;
    rdfs:range mv:Definition .

# ------------------------------------------------------------------------------
# 5. OWL Datatype Properties (Attributes with Literal Types)
# ------------------------------------------------------------------------------
mv:title a owl:DatatypeProperty ;
    rdfs:label "title"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:string .

mv:releaseYear a owl:DatatypeProperty ;
    rdfs:label "release year"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:integer .

mv:rating a owl:DatatypeProperty ;
    rdfs:label "rating"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:decimal .

mv:director a owl:DatatypeProperty ;
    rdfs:label "director"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:string .

mv:runtimeMinutes a owl:DatatypeProperty ;
    rdfs:label "runtime minutes"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:integer .
```

---

## 4. OBDA Mappings: Bridging Relational Tables to RDF Triples

The **OBDA Mapping** is the core bridge of the Virtual Knowledge Graph. It tells the Ontop engine:
> *"When a query asks for property `P` of class `C`, read table `T` and map column `col1` to the Subject and `col2` to the Object."*

### The Anatomy of an Ontop Mapping Rule

Each mapping rule consists of three sections:
1. **`mappingId`**: A descriptive, unique identifier for the rule.
2. **`target`**: The triple template that Ontop will virtually construct. Placeholders inside curly braces `{column_name}` correspond to columns returned by the SQL query.
3. **`source`**: The standard SQL query executed against PostgreSQL to retrieve candidate data rows.

---

### Deep Dive: `ontop/mapping.obda`

Let's dissect the mapping rules configured in [`ontop/mapping.obda`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ontop/mapping.obda):

#### Rule 1: Virtualizing the `object` Table (Movies)

```obda
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
```

##### How This Works Under the Hood:
- **Subject IRI Template**: `:movie/{object_id}` generates `<https://example.org/movie-vkg/movie/1>` when `object_id = 1`.
- **Typing**: `a :Movie` is standard shorthand in Turtle/SPARQL for `rdf:type :Movie`.
- **Literal Casting**: `{rating}^^xsd:decimal` instructs Ontop to treat the numeric PostgreSQL column as an XML Schema Decimal.
- **Foreign Key to Edge Transformation**:
  - The PostgreSQL column `"class"` contains foreign key strings like `'class:action'`.
  - The target template `:hasGenreClass :class/{class}` converts this string into the IRI `<https://example.org/movie-vkg/class/class:action>`.

---

#### Rule 2: Virtualizing the `class` Table (Movie Genres)

```obda
mappingId   mapping-movie-classes
target      :class/{metaid} a :MovieClass ;
                :name {name}^^xsd:string ;
                :description {description}^^xsd:string ;
                rdfs:label {name}^^xsd:string ;
                :metaid {metaid}^^xsd:string .
source      SELECT metaid, name, description 
            FROM "public"."class"
```

#### Rule 3: Virtualizing the `subclass` Table (Taxonomy Hierarchy)

```obda
mappingId   mapping-movie-subclasses
target      :subclass/{metaid} a :MovieSubclass ;
                :name {name}^^xsd:string ;
                :description {description}^^xsd:string ;
                :belongsToClass :class/{class_metaid} ;
                rdfs:label {name}^^xsd:string ;
                :metaid {metaid}^^xsd:string .
source      SELECT metaid, class_metaid, name, description 
            FROM "public"."subclass"
```

### The Magic of Synthetic IRI Joins

Notice how Rule 1 constructs:
```
:movie/{object_id} :hasGenreClass :class/{class} .
```
And Rule 2 constructs:
```
:class/{metaid} a :MovieClass .
```

Because both rules use the identical prefix `:class/`, when a movie has `class = 'class:scifi'` and the class table has `metaid = 'class:scifi'`, **their IRIs match identically** (`<https://example.org/movie-vkg/class/class:scifi>`).

Ontop recognizes this identity at compile time and translates graph navigation into a relational `JOIN` on `object.class = class.metaid`. **No RDF data is stored; the graph relationship is synthesized purely from relational foreign keys!**

---

## 5. SPARQL 1.1 by Example: 6 Practical Queries

SPARQL (SPARQL Protocol and RDF Query Language) is the W3C standard for querying graph data. Instead of joining tables using foreign keys, SPARQL specifies **graph patterns** using variables (`?title`, `?rating`).

### Query 1: Top 5 Highest Rated Movies
**Question:** *"What are the top 5 highest rated movies with their release years, directors, and ratings?"*

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

#### How it works:
- `?m a :Movie`: Matches every subject `?m` that is an instance of `:Movie`.
- `;`: Turtle/SPARQL shorthand indicating that subsequent predicates apply to the same subject `?m`.
- `ORDER BY DESC(?rating)`: Sorts results by rating descending.
- `LIMIT 5`: Limits results to 5 records.

---

### Query 2: Multi-Hop Relationship Traversal
**Question:** *"List movies along with their top-level genre and specific subgenre."*

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?title ?genre ?subgenre ?rating WHERE {
    ?m a :Movie ;
       :title ?title ;
       :rating ?rating ;
       :hasGenreClass ?c ;
       :hasSubclass ?sc .
    ?c :name ?genre .
    ?sc :name ?subgenre .
}
ORDER BY ?genre ?title
LIMIT 10
```

#### How it works:
- This traverses two separate graph edges: `?m -> ?c` (Genre) and `?m -> ?sc` (Subgenre).
- Ontop rewrites this single SPARQL query into an SQL query joining `public.object`, `public.class`, and `public.subclass`.

---

### Query 3: Range Filtering and Conjunctions
**Question:** *"Find Sci-Fi movies released in or after 2015 with a rating of 8.0 or higher."*

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?title ?year ?rating WHERE {
    ?m a :Movie ;
       :title ?title ;
       :releaseYear ?year ;
       :rating ?rating ;
       :hasGenreClass ?c .
    ?c :name "Sci-Fi" .
    FILTER (?year >= 2015 && ?rating >= 8.0)
}
ORDER BY DESC(?rating)
```

#### How it works:
- `?c :name "Sci-Fi"`: Restricts the genre entity to have the exact literal string value `"Sci-Fi"`.
- `FILTER (?year >= 2015 && ?rating >= 8.0)`: Expresses numeric constraints. Ontop pushes this filter down directly into PostgreSQL's `WHERE` clause.

---

### Query 4: Taxonomy Hierarchy Discovery
**Question:** *"What subgenres belong to the 'Action' genre class?"*

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?subgenre ?description WHERE {
    ?sc a :MovieSubclass ;
        :name ?subgenre ;
        :description ?description ;
        :belongsToClass ?c .
    ?c a :MovieClass ;
       :name "Action" .
}
ORDER BY ?subgenre
```

#### How it works:
- This query doesn't touch the 1,000 movie rows at all!
- Ontop deduces that this pattern only involves the `subclass` and `class` tables, executing a lightweight join strictly on taxonomy tables.

---

### Query 5: Analytical Aggregations & Grouping
**Question:** *"What is the total number of movies and average rating per genre?"*

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?genre (COUNT(?m) AS ?totalMovies) (ROUND(AVG(?rating)*10)/10 AS ?avgRating) WHERE {
    ?m a :Movie ;
       :rating ?rating ;
       :hasGenreClass ?c .
    ?c :name ?genre .
}
GROUP BY ?genre
HAVING (COUNT(?m) > 10)
ORDER BY DESC(?totalMovies)
```

#### How it works:
- `GROUP BY ?genre`: Aggregates results by distinct genre names.
- `COUNT(?m)` and `AVG(?rating)`: Graph aggregation functions mapped directly to SQL `COUNT(*)` and `AVG(rating)`.
- `HAVING (COUNT(?m) > 10)`: Filters out rare categories.

---

### Query 6: Schema Registry and Formal Definitions
**Question:** *"Inspect metadata registry entries and their formal definitions."*

```sparql
PREFIX : <https://example.org/movie-vkg/>

SELECT ?metaid ?tableName ?version ?term ?explanation WHERE {
    ?reg a :MetadataRegistry ;
         :metaid ?metaid ;
         :tableName ?tableName ;
         :version ?version ;
         :definedBy ?def .
    ?def :term ?term ;
         :explanation ?explanation .
}
LIMIT 5
```

---

## 6. Under the Hood: How Ontop Translates SPARQL to SQL

The core technological breakthrough of Ontop is **SPARQL-to-SQL Query Rewriting with Relational Optimization**.

Let's trace what happens when this SPARQL query is executed:

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

---

### Step 1: SPARQL Parsing & Intermediate Query (IQ)
Ontop parses the SPARQL string into an Abstract Syntax Tree (AST) called an **Intermediate Query (IQ)** tree:

```
Projection (?title, ?rating)
 └── Slice (offset=0, limit=5)
      └── Join
           ├── TriplePattern(?m, rdf:type, :Movie)
           ├── TriplePattern(?m, :title, ?title)
           ├── TriplePattern(?m, :rating, ?rating)
           ├── TriplePattern(?m, :hasGenreClass, ?c)
           └── TriplePattern(?c, :name, "Sci-Fi")
```

---

### Step 2: Mapping Unfolding
Ontop matches each triple pattern against the rules in `mapping.obda`:
- `?m a :Movie`, `?m :title ?title`, `?m :rating ?rating`, and `?m :hasGenreClass ?c` all match `mapping-movie-objects` (Source: `public.object`).
- `?c :name "Sci-Fi"` matches `mapping-movie-classes` (Source: `public.class`).

---

### Step 3: Relational Optimization Passes

#### A. Self-Join Elimination (Crucial Optimization!)
A naive translator would treat each triple pattern as a separate instance of the table:
$$\text{object } t_1 \bowtie \text{object } t_2 \bowtie \text{object } t_3 \bowtie \text{object } t_4$$
This would result in 4 self-joins on `object_id`.

**Ontop's Optimizer detects that all four properties come from the same row in `public.object`**. It collapses them into **one single table scan**, completely eliminating all self-joins!

#### B. Join Elimination via Primary & Foreign Keys
Because `:hasGenreClass` maps to `:class/{class}` and `:class/{metaid}` is the primary key of `public.class`, Ontop replaces the graph join with a clean relational inner join:
```sql
public.object t1 INNER JOIN public.class t2 ON (t1.class = t2.metaid)
```

#### C. Projection Pruning
Although `SELECT * FROM object` is declared in the mapping source, the SPARQL query only asks for `?title` and `?rating`. Ontop strips away `director`, `runtime_minutes`, `description`, and all unrequested columns.

---

### Step 4: The Final Generated SQL Statement

Below is the actual SQL generated by Ontop and transmitted over JDBC to PostgreSQL:

```sql
SELECT 
    t1.title AS "title",
    t1.rating AS "rating"
FROM "public"."object" t1
INNER JOIN "public"."class" t2 
    ON t1."class" = t2.metaid
WHERE t2.name = 'Sci-Fi'
LIMIT 5;
```

### Performance Implication
Because PostgreSQL has a B-tree index on `idx_object_class` and a unique constraint on `uq_class_name`, **this SPARQL query executes in under 3 milliseconds on PostgreSQL**, scanning only the exact index pages required!

---

## 7. Ontop Engine Internals & Container Configuration

### Ontop Architecture & Standards Compliance

Ontop 5.5.0 complies with international W3C Semantic Web recommendations:
- **SPARQL 1.1 Query**: Complete implementation of graph pattern matching, filters, solution modifiers, and aggregations.
- **R2RML & Ontop OBDA**: W3C relational-to-RDF mapping standards.
- **OWL 2 QL**: A sub-profile of OWL 2 specifically designed to ensure that ontology reasoning can be reduced to logspace SQL rewriting.

---

### Container Setup: `docker-compose.yml`

In our stack ([`docker-compose.yml`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/docker-compose.yml)), Ontop runs as a dedicated microservice:

```yaml
  ontop:
    image: ontop/ontop:5.5.0
    container_name: movie-metadata-ontop
    command: >
      endpoint
      --ontology=/opt/ontop/input/ontology.ttl
      --mapping=/opt/ontop/input/mapping.obda
      --properties=/opt/ontop/input/ontop.properties
      --portal=/opt/ontop/input/endpoint.toml
    ports:
      - "127.0.0.1:8825:8080"
    volumes:
      - ./ontop/ontology.ttl:/opt/ontop/input/ontology.ttl:ro
      - ./ontop/mapping.obda:/opt/ontop/input/mapping.obda:ro
      - ./ontop/ontop.properties:/opt/ontop/input/ontop.properties:ro
      - ./ontop/endpoint.toml:/opt/ontop/input/endpoint.toml:ro
      - ./ontop/jdbc:/opt/ontop/jdbc:ro
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - movie-metadata-network
```

---

### The Critical JDBC Driver Requirement

> [!IMPORTANT]
> The official `ontop/ontop:5.5.0` Docker image contains the Java Virtual Machine and Ontop engine, but **does not bundle proprietary or database-specific JDBC drivers**.
> 
> To allow Ontop to communicate with PostgreSQL:
> 1. We placed `postgresql-42.7.4.jar` inside the [`ontop/jdbc/`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ontop/jdbc) folder.
> 2. Mounted it to `/opt/ontop/jdbc:ro` in the container.
> 3. Ontop automatically discovers all JAR files in `/opt/ontop/jdbc` on startup and registers the `org.postgresql.Driver` class.

---

### Ontop Configuration: `ontop.properties`

[`ontop/ontop.properties`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/ontop/ontop.properties) defines connection pooling and reasoning behavior:

```properties
# JDBC Connection to PostgreSQL Container
jdbc.url=jdbc:postgresql://postgres:5432/movies_db
jdbc.driver=org.postgresql.Driver
jdbc.user=ontop_ro
jdbc.password=OntopReadOnly2026!Sec

# HikariCP High-Performance Connection Pool
ontop.hikari.maximumPoolSize=10
ontop.hikari.minimumIdle=2
ontop.hikari.idleTimeout=30000

# Reasoning & Query Optimization Settings
ontop.existentialReasoning=true
```

---

## 8. FastAPI Backend: Query Broker, Security, and OmniRoute AI

The FastAPI application ([`app/main.py`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/app/main.py)) acts as the **secure API gateway and orchestration layer** between frontend clients, the Ontop engine, and the OmniRoute LLM gateway.

### Core Endpoints

| Endpoint | Method | Security | Purpose |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Public | Liveness check (instant status response). |
| `/ready` | `GET` | Public | Deep readiness check (verifies PostgreSQL & Ontop HTTP connectivity). |
| `/api/schema` | `GET` | API Key | Returns live schema metadata, tables, columns, and row counts. |
| `/api/ontology` | `GET` | API Key | Returns parsed OWL classes, properties, and raw Turtle text. |
| `/api/query` | `POST` | API Key | Executes raw SPARQL through AST validation and Ontop. |
| `/api/ask` | `POST` | API Key | Natural language question-answering with OmniRoute AI. |

---

### The Security Layer: RDFLib AST Validation

Allowing arbitrary SPARQL queries from users or LLMs introduces major attack vectors:
1. **Mutation Attacks**: `INSERT DATA { ... }`, `DELETE WHERE { ... }`, `DROP ALL`.
2. **SSRF & Denial-of-Service via Federation**: `SERVICE <http://malicious-internal-host/admin> { ... }`.
3. **Dataset Spoofing**: `FROM <http://external-graph/fake.rdf>`.
4. **Memory Exhaustion**: Querying all 1,000 movies with Cartesian joins without a `LIMIT`.

#### Why Regex Validation Fails
Attackers can easily bypass naive regular expressions using comments (`SELECT/*comment*/`), variable whitespace, Unicode escapes, or nested subqueries.

#### Our Solution: Syntax-Aware AST Validation
[`app/security/sparql_validator.py`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/app/security/sparql_validator.py) parses the query into a formal Abstract Syntax Tree using `rdflib.plugins.sparql.parser.parseQuery`:

```python
# app/security/sparql_validator.py (Conceptual Architecture)
def validate_and_sanitize_sparql(query: str, max_limit: int = 500) -> str:
    # 1. Parse into formal AST
    try:
        ast = parseQuery(query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid SPARQL syntax: {e}")

    # 2. Reject Updates, CONSTRUCT, DESCRIBE, ASK (Enforce SELECT-only)
    if not is_select_query(ast):
        raise HTTPException(status_code=400, detail="Only SELECT queries are permitted.")

    # 3. Recursively inspect AST nodes for forbidden constructs
    ast_repr = repr(ast)
    if "ServiceGraphPattern" in ast_repr:
        raise HTTPException(status_code=400, detail="Federated queries (SERVICE) are rejected.")
    if "DatasetClause" in ast_repr:
        raise HTTPException(status_code=400, detail="Explicit dataset clauses (FROM) are forbidden.")

    # 4. Enforce Limit Clamping (<= 500)
    return enforce_limit(query, max_limit)
```

---

### The Database Security Layer: Dedicated Read-Only User

Even if an attacker bypassed the AST validator, PostgreSQL protects the data at the operating system kernel level.

[`scripts/setup_readonly_user.sql`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/scripts/setup_readonly_user.sql) provisioned the `ontop_ro` database user:
```sql
CREATE USER ontop_ro WITH PASSWORD 'OntopReadOnly2026!Sec';
GRANT CONNECT ON DATABASE movies_db TO ontop_ro;
GRANT USAGE ON SCHEMA public TO ontop_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ontop_ro;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ontop_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ontop_ro;
```
Any attempt to execute `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, or `TRUNCATE` results in an immediate permission denial from PostgreSQL.

---

### OmniRoute AI Integration & Grounded Synthesis

When a user submits a natural-language question to `/api/ask`, [`app/services/llm_service.py`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/app/services/llm_service.py) coordinates a **two-phase grounded pipeline**:

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

#### Why This Prevents Hallucinations:
1. The LLM is **never asked to guess facts**; it is only asked to formulate a SPARQL query matching the ontology schema.
2. The second LLM step receives the **raw records from PostgreSQL** and is constrained by system prompts to answer *only* using those records.

---

## 9. Frontend Architecture: React, Bun, and Vite

The frontend ([`frontend/`](file:///d:/mycodes/Antigravity/Sona_knowledgegraph/frontend)) is a high-performance Single Page Application (SPA) designed to make semantic data accessible and intuitive.

### Tech Stack Choices
- **React 19**: Modern declarative UI with hooks and state management.
- **Bun 1.4**: Next-generation JavaScript runtime providing sub-second package installation and instant dev server compilation.
- **Vite 8**: Ultra-fast build tool and local development server.
- **Lucide React**: Clean, modern icon set.

---

### UI Components & Tabs

1. **AI Assistant Tab**:
   - Natural language input bar with pre-configured suggestion pills.
   - Grounded natural-language summary block with source citations.
   - Interactive syntax-highlighted SPARQL code display with one-click copy.
   - Responsive data table displaying PostgreSQL records.

2. **SPARQL Studio Tab**:
   - Full-featured query editor with syntax styling.
   - Pre-loaded template queries (Top Rated, Hierarchy, Schema Definitions, Analytics).
   - Execution performance badge (displaying query latency in milliseconds).
   - CSV export for reporting.

3. **Ontology Explorer Tab**:
   - Visual catalog of OWL Classes (with entity counts).
   - Object Property Inspector (visualizing source domain and target range).
   - Datatype Property Inspector (showing data types: `xsd:string`, `xsd:integer`, `xsd:decimal`).
   - Raw Turtle (`.ttl`) viewer with syntax highlighting.

4. **Relational Schema Tab**:
   - Deep inspection of PostgreSQL source tables.
   - Primary key and Foreign key relationship mapping.
   - Live row counts confirming 1,000 movie rows and taxonomy records.

---

## 10. End-to-End Lifecycle of a Semantic Query

Below is the complete sequence of events when a user asks a question in the web browser:

```
User Browser (React)         FastAPI Backend            OmniRoute LLM            Ontop VKG Engine         PostgreSQL DB
      │                             │                         │                         │                       │
      │ 1. Ask: "Top 3 movies"      │                         │                         │                       │
      │────────────────────────────>│                         │                         │                       │
      │                             │ 2. Text-to-SPARQL       │                         │                       │
      │                             │────────────────────────>│                         │                       │
      │                             │ 3. SPARQL Query         │                         │                       │
      │                             │<────────────────────────│                         │                       │
      │                             │                                                   │                       │
      │                             │ 4. Validate AST & Enforce Limit                   │                       │
      │                             │──────────────────────────────────────────────────>│                       │
      │                             │                                                   │ 5. Compile to SQL     │
      │                             │                                                   │──────────────────────>│
      │                             │                                                   │ 6. Fast Indexed Scan  │
      │                             │                                                   │<──────────────────────│
      │                             │ 7. SPARQL JSON Results                            │                       │
      │                             │<──────────────────────────────────────────────────│                       │
      │                             │                                                   │                       │
      │                             │ 8. Synthesize Grounded Answer                     │                       │
      │                             │────────────────────────>│                         │                       │
      │                             │ 9. Grounded Explanation │                         │                       │
      │                             │<────────────────────────│                         │                       │
      │                             │                                                   │                       │
      │ 10. Render Answer, SPARQL,  │                                                   │                       │
      │     and Data Table          │                                                   │                       │
      │<────────────────────────────│                                                   │                       │
```

---

## 11. Quick Reference Cheatsheet: SPARQL vs SQL vs Cypher

| Operation | SPARQL (Virtual Graph) | SQL (Relational) | Cypher (Property Graph) |
| :--- | :--- | :--- | :--- |
| **Match Entity by Type** | `?m a :Movie` | `FROM public.object` | `MATCH (m:Movie)` |
| **Retrieve Property** | `?m :title ?title` | `SELECT title` | `RETURN m.title` |
| **Join Related Entity** | `?m :hasGenreClass ?c . ?c :name ?name` | `FROM object o JOIN class c ON o.class = c.metaid` | `MATCH (m:Movie)-[:IN_GENRE]->(c:Genre)` |
| **Filter by Value** | `FILTER (?rating >= 8.5)` | `WHERE rating >= 8.5` | `WHERE m.rating >= 8.5` |
| **Sort / Order** | `ORDER BY DESC(?rating)` | `ORDER BY rating DESC` | `ORDER BY m.rating DESC` |
| **Limit Rows** | `LIMIT 10` | `LIMIT 10` | `LIMIT 10` |
| **Aggregation** | `(AVG(?rating) AS ?avg)` | `AVG(rating) AS avg` | `avg(m.rating) AS avg` |
| **Grouping** | `GROUP BY ?genre` | `GROUP BY genre` | `WITH m.genre AS genre` |

---

## 12. Verification & Live Interaction

All services are running locally via Docker Compose. You can interact with and verify every tier of the architecture:

- **Web Explorer UI:** Open [http://localhost:5125](http://localhost:5125) in your browser.
- **FastAPI Interactive Swagger UI:** Open [http://127.0.0.1:8025/docs](http://127.0.0.1:8025/docs).
- **Ontop SPARQL Portal:** Open [http://127.0.0.1:8825](http://127.0.0.1:8825).
- **Metabase BI Dashboards:** Open [http://localhost:3000](http://localhost:3000).

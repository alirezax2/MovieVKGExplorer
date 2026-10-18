-- ==============================================================================
-- 001_create_schema.sql
-- Relational Metadata-Driven Movie Schema Definition
-- Target: PostgreSQL 16+
-- ==============================================================================

-- Ensure strict SQL execution
SET client_min_messages = warning;
SET timezone = 'UTC';

-- ------------------------------------------------------------------------------
-- 1. Metadata Identifier Registry (Option B - Unified Metadata Registry)
-- ------------------------------------------------------------------------------
-- Acts as the single source of truth for all global metadata identifiers (metaid).
-- Guarantees that class, subclass, and object type tokens belong to a unified
-- taxonomic identifier space, preventing identifier collisions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metadata_registry (
    metaid VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_registry_entity_type CHECK (entity_type IN ('class', 'subclass', 'object'))
);

COMMENT ON TABLE metadata_registry IS 'Central registry for all globally unique metadata identifiers (metaid)';
COMMENT ON COLUMN metadata_registry.metaid IS 'Global unique metadata identifier token (e.g., class:action, subclass:superhero, object:feature_film)';
COMMENT ON COLUMN metadata_registry.entity_type IS 'Domain type: class, subclass, or object';

-- ------------------------------------------------------------------------------
-- 2. Metadata Definition Table
-- ------------------------------------------------------------------------------
-- Provides descriptive semantics, data typing, namespace, and versioning for
-- every metadata identifier in the registry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS definition (
    definition_id BIGSERIAL PRIMARY KEY,
    metaid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    data_type VARCHAR(64) NOT NULL DEFAULT 'entity',
    namespace VARCHAR(64) NOT NULL DEFAULT 'movies.taxonomy',
    version VARCHAR(16) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_definition_metaid FOREIGN KEY (metaid)
        REFERENCES metadata_registry(metaid) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_definition_entity_type CHECK (entity_type IN ('class', 'subclass', 'object')),
    CONSTRAINT uq_definition_metaid UNIQUE (metaid),
    CONSTRAINT uq_definition_metaid_ns_ver UNIQUE (metaid, namespace, version)
);

COMMENT ON TABLE definition IS 'Semantic definitions, specifications, and data types for metadata concepts';
COMMENT ON COLUMN definition.metaid IS 'References the metadata_registry identifier';
COMMENT ON COLUMN definition.entity_type IS 'Type of entity this definition applies to';
COMMENT ON COLUMN definition.data_type IS 'Expected physical or logical data type';
COMMENT ON COLUMN definition.namespace IS 'Taxonomic namespace grouping related metadata concepts';

-- ------------------------------------------------------------------------------
-- 3. Class Table (Top-level Categories)
-- ------------------------------------------------------------------------------
-- Defines primary categories (Action, Comedy, Drama, etc.).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class (
    metaid VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_metaid FOREIGN KEY (metaid)
        REFERENCES metadata_registry(metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_class_name UNIQUE (name)
);

COMMENT ON TABLE class IS 'Top-level movie taxonomy classifications';
COMMENT ON COLUMN class.metaid IS 'Primary key referencing metadata_registry';
COMMENT ON COLUMN class.name IS 'Unique human-readable name of the class';

-- ------------------------------------------------------------------------------
-- 4. Subclass Table (Specific Categories within a Class)
-- ------------------------------------------------------------------------------
-- Defines granular subcategories that belong strictly to a parent class.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subclass (
    metaid VARCHAR(64) PRIMARY KEY,
    class_metaid VARCHAR(64) NOT NULL,
    name VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subclass_metaid FOREIGN KEY (metaid)
        REFERENCES metadata_registry(metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_subclass_class_metaid FOREIGN KEY (class_metaid)
        REFERENCES class(metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_subclass_class_name UNIQUE (class_metaid, name),
    CONSTRAINT uq_subclass_class_metaid UNIQUE (class_metaid, metaid)
);

COMMENT ON TABLE subclass IS 'Specialized subcategories belonging to a parent class';
COMMENT ON COLUMN subclass.metaid IS 'Primary key referencing metadata_registry';
COMMENT ON COLUMN subclass.class_metaid IS 'Parent class foreign key reference';
COMMENT ON CONSTRAINT uq_subclass_class_metaid ON subclass IS 'Enables composite foreign key verification from object';

-- ------------------------------------------------------------------------------
-- 4b. Relation Class Subclass Table (Explicit Relationship Mapping)
-- ------------------------------------------------------------------------------
-- Explicitly defines how each class and subclass are related to each other for
-- each row, including relationship semantics, type, and descriptive details.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relation_class_subclass (
    relation_id BIGSERIAL PRIMARY KEY,
    class_metaid VARCHAR(64) NOT NULL,
    subclass_metaid VARCHAR(64) NOT NULL,
    relation_type VARCHAR(64) NOT NULL DEFAULT 'thematic_specialization',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rel_class FOREIGN KEY (class_metaid)
        REFERENCES class(metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_rel_subclass FOREIGN KEY (subclass_metaid)
        REFERENCES subclass(metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_rel_class_subclass_composite FOREIGN KEY (class_metaid, subclass_metaid)
        REFERENCES subclass(class_metaid, metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_relation_class_subclass UNIQUE (class_metaid, subclass_metaid)
);

COMMENT ON TABLE relation_class_subclass IS 'Explicit relational mapping detailing how classes and subclasses relate to each other per row';
COMMENT ON COLUMN relation_class_subclass.relation_id IS 'Primary key identifying each relationship row';
COMMENT ON COLUMN relation_class_subclass.class_metaid IS 'Referenced class metadata identifier';
COMMENT ON COLUMN relation_class_subclass.subclass_metaid IS 'Referenced subclass metadata identifier';
COMMENT ON COLUMN relation_class_subclass.relation_type IS 'Nature of taxonomic relationship (e.g. thematic_specialization, subgenre_of)';
COMMENT ON COLUMN relation_class_subclass.description IS 'Detailed explanation of how this subclass relates to its parent class';


-- ------------------------------------------------------------------------------
-- 5. Object Table (Movie Records)
-- ------------------------------------------------------------------------------
-- Represents individual movie entities. Contains the required fields:
-- class, subclass, and metaid, with composite FK enforcing taxonomic integrity.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS object (
    object_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_year INTEGER NOT NULL,
    director VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    "class" VARCHAR(64) NOT NULL,
    subclass VARCHAR(64) NOT NULL,
    metaid VARCHAR(64) NOT NULL,
    runtime_minutes INTEGER NOT NULL,
    rating NUMERIC(3, 1) NOT NULL,
    original_language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Check constraints ensuring data sanity
    CONSTRAINT chk_object_release_year CHECK (release_year BETWEEN 1888 AND 2100),
    CONSTRAINT chk_object_rating CHECK (rating >= 1.0 AND rating <= 10.0),
    CONSTRAINT chk_object_runtime CHECK (runtime_minutes BETWEEN 30 AND 600),
    CONSTRAINT uq_object_title_year UNIQUE (title, release_year),

    -- Foreign Key constraints
    CONSTRAINT fk_object_class FOREIGN KEY ("class")
        REFERENCES class(metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_object_class_subclass FOREIGN KEY ("class", subclass)
        REFERENCES subclass(class_metaid, metaid) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_object_metaid FOREIGN KEY (metaid)
        REFERENCES metadata_registry(metaid) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE object IS 'Core movie entity records';
COMMENT ON COLUMN object.object_id IS 'Unique serial primary key for each movie record';
COMMENT ON COLUMN object.class IS 'Class metadata identifier (primary category)';
COMMENT ON COLUMN object.subclass IS 'Subclass metadata identifier (granular subcategory)';
COMMENT ON COLUMN object.metaid IS 'Object metadata identifier (structural film format / archetype)';
COMMENT ON CONSTRAINT fk_object_class_subclass ON object IS 'Enforces that a movie subclass must belong to the movie assigned class';

-- ------------------------------------------------------------------------------
-- 6. Indexes for Optimized Query and Join Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_object_title ON object(title);
CREATE INDEX IF NOT EXISTS idx_object_release_year ON object(release_year);
CREATE INDEX IF NOT EXISTS idx_object_class ON object("class");
CREATE INDEX IF NOT EXISTS idx_object_subclass ON object(subclass);
CREATE INDEX IF NOT EXISTS idx_object_class_subclass ON object("class", subclass);
CREATE INDEX IF NOT EXISTS idx_object_metaid ON object(metaid);
CREATE INDEX IF NOT EXISTS idx_object_rating ON object(rating);
CREATE INDEX IF NOT EXISTS idx_object_director ON object(director);

CREATE INDEX IF NOT EXISTS idx_subclass_class_metaid ON subclass(class_metaid);
CREATE INDEX IF NOT EXISTS idx_rel_class_subclass_class ON relation_class_subclass(class_metaid);
CREATE INDEX IF NOT EXISTS idx_rel_class_subclass_subclass ON relation_class_subclass(subclass_metaid);
CREATE INDEX IF NOT EXISTS idx_definition_metaid ON definition(metaid);
CREATE INDEX IF NOT EXISTS idx_definition_namespace ON definition(namespace);
CREATE INDEX IF NOT EXISTS idx_definition_entity_type ON definition(entity_type);


-- ------------------------------------------------------------------------------
-- 7. Timestamp Update Trigger Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_object_updated_at ON object;
CREATE TRIGGER trg_object_updated_at
BEFORE UPDATE ON object
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_definition_updated_at ON definition;
CREATE TRIGGER trg_definition_updated_at
BEFORE UPDATE ON definition
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();

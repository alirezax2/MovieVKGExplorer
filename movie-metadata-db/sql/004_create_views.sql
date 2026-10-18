-- ==============================================================================
-- 004_create_views.sql
-- Reporting, Catalog, and Analytical SQL Views
-- Target: PostgreSQL 16+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. v_movie_catalog
-- ------------------------------------------------------------------------------
-- A denormalized, human-readable view combining core movie attributes,
-- resolved taxonomy names (class and subclass), and object metadata definitions.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_movie_catalog AS
SELECT 
    o.object_id,
    o.title,
    o.release_year,
    o.director,
    c.name AS class_name,
    sc.name AS subclass_name,
    o.metaid,
    d.name AS definition_name,
    d.description AS definition_description,
    o.rating,
    o.runtime_minutes,
    o.original_language,
    o.created_at
FROM object o
JOIN class c 
    ON o."class" = c.metaid
JOIN subclass sc 
    ON o.subclass = sc.metaid AND o."class" = sc.class_metaid
LEFT JOIN definition d 
    ON o.metaid = d.metaid;

COMMENT ON VIEW v_movie_catalog IS 'Denormalized, read-friendly movie catalog with resolved taxonomy names and object definitions';

-- ------------------------------------------------------------------------------
-- 2. v_movie_counts_by_class
-- ------------------------------------------------------------------------------
-- Aggregates movie counts and analytical statistics by top-level class.
-- Uses LEFT JOIN to ensure categories with zero movies are faithfully included.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_movie_counts_by_class AS
SELECT 
    c.metaid AS class_metaid,
    c.name AS class_name,
    COUNT(o.object_id)::bigint AS movie_count,
    ROUND(COALESCE(AVG(o.rating), 0.0), 2) AS avg_rating,
    COALESCE(MIN(o.rating), 0.0) AS min_rating,
    COALESCE(MAX(o.rating), 0.0) AS max_rating,
    ROUND(COALESCE(AVG(o.runtime_minutes), 0.0), 1) AS avg_runtime_minutes
FROM class c
LEFT JOIN object o 
    ON c.metaid = o."class"
GROUP BY c.metaid, c.name
ORDER BY movie_count DESC, c.name ASC;

COMMENT ON VIEW v_movie_counts_by_class IS 'Aggregated movie count, rating, and runtime statistics grouped by class, including classes with 0 movies';

-- ------------------------------------------------------------------------------
-- 3. v_movie_counts_by_subclass
-- ------------------------------------------------------------------------------
-- Aggregates movie counts and analytical statistics by subclass.
-- Uses LEFT JOIN to ensure subclasses with zero movies are faithfully included.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_movie_counts_by_subclass AS
SELECT 
    c.metaid AS class_metaid,
    c.name AS class_name,
    sc.metaid AS subclass_metaid,
    sc.name AS subclass_name,
    COUNT(o.object_id)::bigint AS movie_count,
    ROUND(COALESCE(AVG(o.rating), 0.0), 2) AS avg_rating,
    ROUND(COALESCE(AVG(o.runtime_minutes), 0.0), 1) AS avg_runtime_minutes
FROM subclass sc
JOIN class c 
    ON sc.class_metaid = c.metaid
LEFT JOIN object o 
    ON sc.metaid = o.subclass AND sc.class_metaid = o."class"
GROUP BY c.metaid, c.name, sc.metaid, sc.name
ORDER BY c.name ASC, movie_count DESC, sc.name ASC;

COMMENT ON VIEW v_movie_counts_by_subclass IS 'Aggregated movie count and performance metrics grouped by subclass, including subclasses with 0 movies';

-- ------------------------------------------------------------------------------
-- 4. v_movie_metadata
-- ------------------------------------------------------------------------------
-- Provides an inspectable representation of movies and their associated
-- metadata definitions across all taxonomy levels (class, subclass, and object).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_movie_metadata AS
SELECT 
    o.object_id,
    o.title,
    o.release_year,
    o.director,
    o.rating,
    o.metaid AS object_metaid,
    obj_def.name AS object_type_name,
    obj_def.description AS object_type_description,
    c.metaid AS class_metaid,
    c.name AS class_name,
    c.description AS class_description,
    sc.metaid AS subclass_metaid,
    sc.name AS subclass_name,
    sc.description AS subclass_description,
    obj_def.namespace AS metadata_namespace,
    obj_def.version AS metadata_version
FROM object o
JOIN class c 
    ON o."class" = c.metaid
JOIN subclass sc 
    ON o.subclass = sc.metaid AND o."class" = sc.class_metaid
LEFT JOIN definition obj_def 
    ON o.metaid = obj_def.metaid;

COMMENT ON VIEW v_movie_metadata IS 'Comprehensive inspectable view linking movies to their complete metadata definitions across all levels';

-- ------------------------------------------------------------------------------
-- 5. v_class_subclass_relations
-- ------------------------------------------------------------------------------
-- Exposes the explicit relationship mapping between classes and subclasses,
-- showing how each subcategory is taxonomically related to its parent class.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_class_subclass_relations AS
SELECT 
    r.relation_id,
    c.metaid AS class_metaid,
    c.name AS class_name,
    sc.metaid AS subclass_metaid,
    sc.name AS subclass_name,
    r.relation_type,
    r.description AS relationship_description,
    COUNT(o.object_id)::bigint AS movie_count,
    ROUND(COALESCE(AVG(o.rating), 0.0), 2) AS avg_rating
FROM relation_class_subclass r
JOIN class c 
    ON r.class_metaid = c.metaid
JOIN subclass sc 
    ON r.subclass_metaid = sc.metaid
LEFT JOIN object o 
    ON o."class" = r.class_metaid AND o.subclass = r.subclass_metaid
GROUP BY r.relation_id, c.metaid, c.name, sc.metaid, sc.name, r.relation_type, r.description
ORDER BY c.name ASC, sc.name ASC;

COMMENT ON VIEW v_class_subclass_relations IS 'Detailed view of explicit class-to-subclass taxonomic relationships and associated metrics';


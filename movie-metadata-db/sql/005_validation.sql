-- ==============================================================================
-- 005_validation.sql
-- Automated Validation Test Suite and Cross-Table Integrity Verification
-- Target: PostgreSQL 16+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Automated Integrity & Consistency Checks (Throws EXCEPTION on Failure)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_movie_count BIGINT;
    v_distinct_ids BIGINT;
    v_distinct_titles BIGINT;
    v_null_fields BIGINT;
    v_orphan_classes BIGINT;
    v_orphan_subclasses BIGINT;
    v_mismatched_subclasses BIGINT;
    v_orphan_metaids BIGINT;
    v_missing_definitions BIGINT;
    v_duplicate_metaids BIGINT;
    v_catalog_count BIGINT;
    v_class_sum BIGINT;
    v_subclass_sum BIGINT;
    v_metadata_view_count BIGINT;
    v_relation_count BIGINT;
    v_relation_distinct_ids BIGINT;
    v_relation_mismatches BIGINT;
    v_rel_view_count BIGINT;
    v_rel_view_sum BIGINT;
BEGIN
    RAISE NOTICE '==============================================================';
    RAISE NOTICE 'STARTING AUTOMATED DATABASE VALIDATION CHECKS';
    RAISE NOTICE '==============================================================';

    -- Check 1: Exactly 1,000 movie records exist
    SELECT COUNT(*) INTO v_movie_count FROM object;
    IF v_movie_count <> 1000 THEN
        RAISE EXCEPTION 'CHECK 1 FAILED: Expected exactly 1,000 movie records, found %', v_movie_count;
    END IF;
    RAISE NOTICE ' [PASS] Check 1: Exactly 1,000 movie records exist.';

    -- Check 2: Movie IDs are strictly unique
    SELECT COUNT(DISTINCT object_id) INTO v_distinct_ids FROM object;
    IF v_distinct_ids <> 1000 THEN
        RAISE EXCEPTION 'CHECK 2 FAILED: Expected 1,000 unique object_ids, found %', v_distinct_ids;
    END IF;
    RAISE NOTICE ' [PASS] Check 2: All 1,000 object_ids are unique.';

    -- Check 3: Movie titles are distinct
    SELECT COUNT(DISTINCT title) INTO v_distinct_titles FROM object;
    IF v_distinct_titles <> 1000 THEN
        RAISE EXCEPTION 'CHECK 3 FAILED: Expected 1,000 distinct titles, found %', v_distinct_titles;
    END IF;
    RAISE NOTICE ' [PASS] Check 3: All 1,000 movie titles are distinct.';

    -- Check 4: No NULLs in required movie columns
    SELECT COUNT(*) INTO v_null_fields 
    FROM object 
    WHERE title IS NULL 
       OR release_year IS NULL 
       OR director IS NULL 
       OR description IS NULL 
       OR "class" IS NULL 
       OR subclass IS NULL 
       OR metaid IS NULL 
       OR runtime_minutes IS NULL 
       OR rating IS NULL 
       OR original_language IS NULL;
    IF v_null_fields > 0 THEN
        RAISE EXCEPTION 'CHECK 4 FAILED: Found % rows with NULL values in required fields', v_null_fields;
    END IF;
    RAISE NOTICE ' [PASS] Check 4: All required movie attributes are populated without NULLs.';

    -- Check 5: No invalid or orphaned class references
    SELECT COUNT(*) INTO v_orphan_classes
    FROM object o
    WHERE NOT EXISTS (SELECT 1 FROM class c WHERE c.metaid = o."class");
    IF v_orphan_classes > 0 THEN
        RAISE EXCEPTION 'CHECK 5 FAILED: Found % movie records referencing non-existent classes', v_orphan_classes;
    END IF;
    RAISE NOTICE ' [PASS] Check 5: All movie class references are valid and resolve to class table.';

    -- Check 6: No invalid or orphaned subclass references
    SELECT COUNT(*) INTO v_orphan_subclasses
    FROM object o
    WHERE NOT EXISTS (SELECT 1 FROM subclass sc WHERE sc.metaid = o.subclass);
    IF v_orphan_subclasses > 0 THEN
        RAISE EXCEPTION 'CHECK 6 FAILED: Found % movie records referencing non-existent subclasses', v_orphan_subclasses;
    END IF;
    RAISE NOTICE ' [PASS] Check 6: All movie subclass references are valid and resolve to subclass table.';

    -- Check 7: No movie uses a subclass belonging to another class
    SELECT COUNT(*) INTO v_mismatched_subclasses
    FROM object o
    JOIN subclass sc ON o.subclass = sc.metaid
    WHERE o."class" <> sc.class_metaid;
    IF v_mismatched_subclasses > 0 THEN
        RAISE EXCEPTION 'CHECK 7 FAILED: Found % movies with mismatched class and subclass hierarchy', v_mismatched_subclasses;
    END IF;
    RAISE NOTICE ' [PASS] Check 7: Taxonomic consistency verified: every subclass belongs to the movie class.';

    -- Check 8: Object metaids resolve to metadata_registry and definition table
    SELECT COUNT(*) INTO v_missing_definitions
    FROM object o
    WHERE NOT EXISTS (SELECT 1 FROM definition d WHERE d.metaid = o.metaid);
    IF v_missing_definitions > 0 THEN
        RAISE EXCEPTION 'CHECK 8 FAILED: Found % movies referencing undefined metadata identifiers', v_missing_definitions;
    END IF;
    RAISE NOTICE ' [PASS] Check 8: All object metaids have registered semantic definitions in definition table.';

    -- Check 9: No duplicate metadata identifiers exist within the relevant namespace
    SELECT COUNT(*) INTO v_duplicate_metaids
    FROM (
        SELECT metaid, namespace, COUNT(*)
        FROM definition
        GROUP BY metaid, namespace
        HAVING COUNT(*) > 1
    ) dup;
    IF v_duplicate_metaids > 0 THEN
        RAISE EXCEPTION 'CHECK 9 FAILED: Found % duplicate metadata identifiers within namespace', v_duplicate_metaids;
    END IF;
    RAISE NOTICE ' [PASS] Check 9: No duplicate metadata identifiers exist within namespaces.';

    -- Check 10: Views return correct counts and aggregated sums match underlying records
    SELECT COUNT(*) INTO v_catalog_count FROM v_movie_catalog;
    SELECT COALESCE(SUM(movie_count), 0) INTO v_class_sum FROM v_movie_counts_by_class;
    SELECT COALESCE(SUM(movie_count), 0) INTO v_subclass_sum FROM v_movie_counts_by_subclass;
    SELECT COUNT(*) INTO v_metadata_view_count FROM v_movie_metadata;

    IF v_catalog_count <> 1000 THEN
        RAISE EXCEPTION 'CHECK 10.1 FAILED: v_movie_catalog returned % rows, expected 1000', v_catalog_count;
    END IF;
    IF v_class_sum <> 1000 THEN
        RAISE EXCEPTION 'CHECK 10.2 FAILED: v_movie_counts_by_class sum is %, expected 1000', v_class_sum;
    END IF;
    IF v_subclass_sum <> 1000 THEN
        RAISE EXCEPTION 'CHECK 10.3 FAILED: v_movie_counts_by_subclass sum is %, expected 1000', v_subclass_sum;
    END IF;
    IF v_metadata_view_count <> 1000 THEN
        RAISE EXCEPTION 'CHECK 10.4 FAILED: v_movie_metadata returned % rows, expected 1000', v_metadata_view_count;
    END IF;
    RAISE NOTICE ' [PASS] Check 10: All reporting views return verified data matching the 1,000 records.';

    -- Check 11: Verify relation_class_subclass integrity and view consistency
    SELECT COUNT(*) INTO v_relation_count FROM relation_class_subclass;
    SELECT COUNT(DISTINCT relation_id) INTO v_relation_distinct_ids FROM relation_class_subclass;
    
    IF v_relation_count <> 50 THEN
        RAISE EXCEPTION 'CHECK 11.1 FAILED: Expected exactly 50 rows in relation_class_subclass, found %', v_relation_count;
    END IF;
    IF v_relation_distinct_ids <> 50 THEN
        RAISE EXCEPTION 'CHECK 11.2 FAILED: Expected 50 distinct relation_id values, found %', v_relation_distinct_ids;
    END IF;

    SELECT COUNT(*) INTO v_relation_mismatches
    FROM relation_class_subclass r
    WHERE NOT EXISTS (
        SELECT 1 FROM subclass sc 
        WHERE sc.class_metaid = r.class_metaid AND sc.metaid = r.subclass_metaid
    );
    IF v_relation_mismatches > 0 THEN
        RAISE EXCEPTION 'CHECK 11.3 FAILED: Found % rows in relation_class_subclass with invalid class-subclass mapping', v_relation_mismatches;
    END IF;

    SELECT COUNT(*), COALESCE(SUM(movie_count), 0) 
    INTO v_rel_view_count, v_rel_view_sum 
    FROM v_class_subclass_relations;

    IF v_rel_view_count <> 50 THEN
        RAISE EXCEPTION 'CHECK 11.4 FAILED: v_class_subclass_relations returned % rows, expected 50', v_rel_view_count;
    END IF;
    IF v_rel_view_sum <> 1000 THEN
        RAISE EXCEPTION 'CHECK 11.5 FAILED: v_class_subclass_relations movie sum is %, expected 1000', v_rel_view_sum;
    END IF;
    RAISE NOTICE ' [PASS] Check 11: relation_class_subclass verified with 50 valid mappings and view consistency.';

    RAISE NOTICE '==============================================================';
    RAISE NOTICE 'ALL 11 VALIDATION ASSERTIONS COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================================';
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Diagnostic Summary: Record Counts Across All Tables
-- ------------------------------------------------------------------------------
SELECT 'metadata_registry' AS table_name, COUNT(*) AS total_records FROM metadata_registry
UNION ALL
SELECT 'definition', COUNT(*) FROM definition
UNION ALL
SELECT 'class', COUNT(*) FROM class
UNION ALL
SELECT 'subclass', COUNT(*) FROM subclass
UNION ALL
SELECT 'relation_class_subclass', COUNT(*) FROM relation_class_subclass
UNION ALL
SELECT 'object', COUNT(*) FROM object
ORDER BY total_records DESC;


-- ------------------------------------------------------------------------------
-- 3. Diagnostic Summary: Movie Counts by Class View Preview
-- ------------------------------------------------------------------------------
SELECT 
    class_name,
    movie_count,
    avg_rating,
    min_rating,
    max_rating,
    avg_runtime_minutes
FROM v_movie_counts_by_class;

-- ------------------------------------------------------------------------------
-- 4. Example Query: Full Relational Join Across All 4 Core Tables
-- ------------------------------------------------------------------------------
-- Demonstrates how object, class, subclass, and definition are joined
-- to produce a comprehensive metadata-enriched cinema record.
-- ------------------------------------------------------------------------------
SELECT 
    o.object_id,
    o.title,
    o.release_year,
    o.director,
    o.rating,
    c.name AS class_name,
    sc.name AS subclass_name,
    obj_def.name AS object_archetype,
    obj_def.data_type,
    obj_def.namespace
FROM object o
JOIN class c 
    ON o."class" = c.metaid
JOIN subclass sc 
    ON o.subclass = sc.metaid AND o."class" = sc.class_metaid
JOIN definition obj_def 
    ON o.metaid = obj_def.metaid
ORDER BY o.rating DESC, o.release_year DESC
LIMIT 5;

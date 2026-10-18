-- ==============================================================================
-- 006_grant_readonly_access.sql
-- Grant read-only access to ontop_ro on all existing tables and views
-- Target: PostgreSQL 16+
-- ==============================================================================
-- Runs after all tables/views have been created to ensure ontop_ro can
-- SELECT from everything. This is needed because ALTER DEFAULT PRIVILEGES
-- in 000_create_roles.sql only covers tables created AFTER that command.
-- ==============================================================================

SET client_min_messages = warning;

-- Grant SELECT on all existing tables in public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ontop_ro;

-- Grant SELECT on all existing sequences (if any queries need them)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ontop_ro;

-- Log success
DO $$ BEGIN RAISE NOTICE 'Read-only access granted to ontop_ro on all existing tables'; END $$;

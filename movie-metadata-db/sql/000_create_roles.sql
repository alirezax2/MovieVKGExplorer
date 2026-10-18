-- ==============================================================================
-- 000_create_roles.sql
-- Create application-specific database roles
-- Target: PostgreSQL 16+
-- ==============================================================================
-- Creates a read-only role for the Ontop VKG engine and the FastAPI backend.
-- This script runs before schema creation to ensure the role exists when
-- GRANT statements are applied.
-- ==============================================================================

SET client_min_messages = warning;

-- Create ontop_ro role (read-only for VKG queries)
-- Using DO block so re-runs don't fail if role already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ontop_ro') THEN
        CREATE ROLE ontop_ro WITH LOGIN PASSWORD 'dev_ontop_ro_secret_password_2026';
    END IF;
END
$$;

-- Grant connect privilege
GRANT CONNECT ON DATABASE movies_db TO ontop_ro;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO ontop_ro;

-- Grant SELECT on all existing tables (will also cover tables created by later scripts)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ontop_ro;

-- Log success
DO $$ BEGIN RAISE NOTICE 'Role ontop_ro created and granted read access'; END $$;

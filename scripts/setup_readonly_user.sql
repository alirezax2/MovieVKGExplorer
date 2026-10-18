-- ==============================================================================
-- scripts/setup_readonly_user.sql
-- Create dedicated read-only role for Ontop Virtual Knowledge Graph queries.
-- Does not modify any existing application tables or data.
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ontop_ro') THEN
        CREATE ROLE ontop_ro WITH LOGIN PASSWORD 'dev_ontop_ro_secret_password_2026';
        RAISE NOTICE 'Role ontop_ro created successfully.';
    ELSE
        RAISE NOTICE 'Role ontop_ro already exists.';
    END IF;
END
$$;

-- Grant connection to the target database
GRANT CONNECT ON DATABASE movies_db TO ontop_ro;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO ontop_ro;

-- Grant read-only access to all current tables and views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ontop_ro;

-- Grant read-only access to future tables created by movie_admin
ALTER DEFAULT PRIVILEGES FOR ROLE movie_admin IN SCHEMA public GRANT SELECT ON TABLES TO ontop_ro;

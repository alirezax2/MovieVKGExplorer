"""Regression and safety tests verifying database preservation and security guarantees."""

import pytest
from sqlalchemy import create_engine, text

from app.config import settings


def test_database_row_counts_preserved():
    """Verify that database record counts are strictly preserved and unmodified."""
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        movie_count = conn.execute(text("SELECT COUNT(*) FROM object")).scalar()
        class_count = conn.execute(text("SELECT COUNT(*) FROM class")).scalar()
        subclass_count = conn.execute(text("SELECT COUNT(*) FROM subclass")).scalar()
        definition_count = conn.execute(text("SELECT COUNT(*) FROM definition")).scalar()
        registry_count = conn.execute(text("SELECT COUNT(*) FROM metadata_registry")).scalar()
        relation_count = conn.execute(text("SELECT COUNT(*) FROM relation_class_subclass")).scalar()

    assert movie_count == 1000, "Source movie records count must remain exactly 1,000"
    assert class_count == 14, "Source class records count must remain exactly 14"
    assert subclass_count == 50, "Source subclass records count must remain exactly 50"
    assert definition_count == 68, "Source definition records count must remain exactly 68"
    assert registry_count == 68, "Source metadata registry records count must remain exactly 68"
    assert relation_count == 50, "Source relation records count must remain exactly 50"


def test_no_data_modification_by_readonly_user():
    """Verify that ontop_ro user cannot execute DDL or DML against the database."""
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        with pytest.raises(Exception):
            conn.execute(text("INSERT INTO object (title, release_year) VALUES ('Hacked', 2026)"))
        with pytest.raises(Exception):
            conn.execute(text("DROP TABLE object CASCADE"))
        with pytest.raises(Exception):
            conn.execute(text("CREATE TABLE test_table (id int)"))


def test_secrets_not_leaked_in_api_responses(client, auth_headers):
    """Verify that credentials and secrets never leak in responses."""
    # 1. Health
    h = client.get("/health").text
    assert settings.postgres_password not in h
    assert settings.omniroute_api_key not in h

    # 2. Ready
    r = client.get("/ready").text
    assert settings.postgres_password not in r
    assert settings.omniroute_api_key not in r

    # 3. Schema
    s = client.get("/schema", headers=auth_headers).text
    assert settings.postgres_password not in s
    assert settings.omniroute_api_key not in s

    # 4. Error response
    err = client.post("/query", json={"query": "BAD QUERY"}, headers=auth_headers).text
    assert settings.postgres_password not in err
    assert settings.omniroute_api_key not in err

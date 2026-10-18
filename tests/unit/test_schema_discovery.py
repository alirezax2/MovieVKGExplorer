"""Unit tests for schema discovery and normalization."""

import json
from pathlib import Path


def test_schema_json_artifact_exists_and_valid():
    schema_path = Path("artifacts/schema.json")
    assert schema_path.exists(), "artifacts/schema.json must exist"

    with open(schema_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "database_name" in data
    assert "public" in data["schemas"]
    public_tables = data["schemas"]["public"]["tables"]

    # Verify core tables
    expected_tables = ["object", "class", "subclass", "definition", "metadata_registry", "relation_class_subclass"]
    for tbl in expected_tables:
        assert tbl in public_tables, f"Table {tbl} must be present in schema discovery"
        assert len(public_tables[tbl]["primary_key"]) > 0, f"Table {tbl} must have primary key"
        assert public_tables[tbl]["mapping_eligibility"] == "eligible"


def test_views_discovery():
    schema_path = Path("artifacts/schema.json")
    with open(schema_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    public_views = data["schemas"]["public"]["views"]
    expected_views = [
        "v_movie_catalog",
        "v_movie_counts_by_class",
        "v_movie_counts_by_subclass",
        "v_movie_metadata",
        "v_class_subclass_relations",
    ]
    for vw in expected_views:
        assert vw in public_views, f"View {vw} must be discovered"

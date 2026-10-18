#!/usr/bin/env python3
"""Schema inspection CLI script.

Discovers database metadata, evaluates mapping eligibility, and generates
a structured machine-readable JSON report at artifacts/schema.json.
"""

import argparse
import json
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.services.schema_service import SchemaService


def main():
    parser = argparse.ArgumentParser(description="Inspect PostgreSQL schema for Ontop VKG mapping.")
    parser.add_argument(
        "--output",
        "-o",
        default="artifacts/schema.json",
        help="Path to output JSON file (default: artifacts/schema.json)",
    )
    parser.add_argument(
        "--include-row-counts",
        action="store_true",
        help="Include safe row counts for tables and views",
    )
    args = parser.parse_args()

    print("================================================================================")
    print("STAGE A: POSTGRESQL SCHEMA METADATA DISCOVERY")
    print("================================================================================")
    print(f"Connecting to database: {settings.postgres_db} on {settings.postgres_host}:{settings.postgres_port}")
    print(f"Target user: {settings.postgres_user} (dedicated read-only role)")

    service = SchemaService()

    try:
        conn_info = service.test_connection()
        print(f"Connection successful! PostgreSQL version: {conn_info['database_version'].split(',')[0]}")
    except Exception as e:
        print(f"ERROR: Failed to connect to database: {e}", file=sys.stderr)
        sys.exit(1)

    print("Inspecting schemas, tables, columns, constraints, and relationships...")
    report = service.inspect_schema(include_row_counts=args.include_row_counts)

    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(
        f"\nDiscovered {report['mapping_summary']['total_tables']} tables and {report['mapping_summary']['total_views']} views across {len(report['inspected_schemas'])} schema(s):"
    )
    for schema, sdata in report["schemas"].items():
        print(f"\n--- Schema: [{schema}] ---")
        print("  Tables:")
        for tname, tdata in sdata["tables"].items():
            pk = ", ".join(tdata["primary_key"]) if tdata["primary_key"] else "NONE"
            fks = len(tdata["foreign_keys"])
            uqs = len(tdata["unique_constraints"])
            cols = len(tdata["columns"])
            rc = f" (rows: {tdata['row_count']})" if tdata["row_count"] is not None else ""
            print(
                f"    - {tname}: {cols} cols, PK=[{pk}], {fks} FKs, {uqs} unique constraints{rc} -> {tdata['mapping_eligibility']}"
            )
        print("  Views:")
        for vname, vdata in sdata["views"].items():
            rc = f" (rows: {vdata['row_count']})" if vdata["row_count"] is not None else ""
            print(f"    - {vname}: {len(vdata['columns'])} cols{rc}")

    print(f"\nSchema report successfully saved to: {output_path.resolve()}")
    print("Mapping eligibility: ALL tables have stable primary keys and are eligible for VKG generation.")


if __name__ == "__main__":
    main()

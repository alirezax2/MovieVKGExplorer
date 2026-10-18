"""Schema inspection service for relational metadata discovery.

Uses SQLAlchemy and psycopg to inspect PostgreSQL schemas, tables, columns,
constraints, keys, and views in a strictly read-only manner.
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

from app.config import settings


class SchemaService:
    def __init__(self, engine: Optional[Engine] = None):
        self.engine = engine or create_engine(
            settings.database_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 10},
        )

    def test_connection(self) -> Dict[str, Any]:
        """Verify database connectivity and return basic server version info."""
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT version(), current_database(), current_user"))
            row = result.fetchone()
            return {
                "connected": True,
                "database_version": row[0] if row else "Unknown",
                "database_name": row[1] if row else "Unknown",
                "current_user": row[2] if row else "Unknown",
            }

    def inspect_schema(self, include_row_counts: bool = False, schemas: Optional[List[str]] = None) -> Dict[str, Any]:
        """Perform full metadata inspection across approved database schemas.

        Args:
            include_row_counts: If True, executes safe SELECT COUNT(*) on eligible tables.
            schemas: Optional list of schemas to inspect. Defaults to non-system schemas.

        Returns:
            Dictionary matching the required artifacts/schema.json contract.
        """
        inspector = inspect(self.engine)
        all_schemas = inspector.get_schema_names()

        # Exclude system schemas
        system_schemas = {"information_schema", "pg_catalog", "pg_toast"}
        target_schemas = [s for s in all_schemas if s not in system_schemas and not s.startswith("pg_temp")]
        if schemas:
            target_schemas = [s for s in target_schemas if s in schemas]

        report: Dict[str, Any] = {
            "database_name": settings.postgres_db,
            "inspected_schemas": target_schemas,
            "schemas": {},
            "mapping_summary": {
                "total_tables": 0,
                "total_views": 0,
                "eligible_tables": [],
                "tables_requiring_review": [],
                "views": [],
                "warnings": [],
            },
        }

        with self.engine.connect() as conn:
            for schema in target_schemas:
                schema_data: Dict[str, Any] = {"tables": {}, "views": {}}

                # Inspect tables
                table_names = inspector.get_table_names(schema=schema)
                for tbl in table_names:
                    report["mapping_summary"]["total_tables"] += 1
                    columns = inspector.get_columns(tbl, schema=schema)
                    pk_info = inspector.get_pk_constraint(tbl, schema=schema)
                    fks = inspector.get_foreign_keys(tbl, schema=schema)
                    uniques = inspector.get_unique_constraints(tbl, schema=schema)
                    indexes = inspector.get_indexes(tbl, schema=schema)

                    pk_cols = pk_info.get("constrained_columns", []) if pk_info else []

                    # Column normalization
                    col_details = []
                    for col in columns:
                        col_details.append(
                            {
                                "name": col["name"],
                                "type": str(col["type"]),
                                "nullable": col.get("nullable", True),
                                "default": str(col.get("default", "")) if col.get("default") is not None else None,
                                "is_primary_key": col["name"] in pk_cols,
                            }
                        )

                    # Foreign keys normalization
                    fk_details = []
                    for fk in fks:
                        fk_details.append(
                            {
                                "name": fk.get("name"),
                                "constrained_columns": fk.get("constrained_columns", []),
                                "referred_schema": fk.get("referred_schema") or schema,
                                "referred_table": fk.get("referred_table"),
                                "referred_columns": fk.get("referred_columns", []),
                            }
                        )

                    # Unique constraints normalization
                    uq_details = []
                    for uq in uniques:
                        uq_details.append(
                            {
                                "name": uq.get("name"),
                                "column_names": uq.get("column_names", []),
                            }
                        )

                    # Safe row count if explicitly requested
                    row_count = None
                    if include_row_counts:
                        try:
                            quoted_schema = f'"{schema}"'
                            quoted_tbl = f'"{tbl}"'
                            res = conn.execute(text(f"SELECT COUNT(*) FROM {quoted_schema}.{quoted_tbl}"))
                            row_count = res.scalar()
                        except Exception as e:
                            report["mapping_summary"]["warnings"].append(
                                f"Failed to get row count for table {schema}.{tbl}: {str(e)}"
                            )

                    # Assess mapping eligibility
                    warnings = []
                    if not pk_cols:
                        eligibility = "review_needed"
                        warnings.append("Missing primary key. Subject IRI generation requires a stable unique key.")
                        report["mapping_summary"]["tables_requiring_review"].append(f"{schema}.{tbl}")
                    else:
                        eligibility = "eligible"
                        report["mapping_summary"]["eligible_tables"].append(f"{schema}.{tbl}")

                    schema_data["tables"][tbl] = {
                        "columns": col_details,
                        "primary_key": pk_cols,
                        "foreign_keys": fk_details,
                        "unique_constraints": uq_details,
                        "indexes": [idx.get("name") for idx in indexes if idx.get("name")],
                        "row_count": row_count,
                        "mapping_eligibility": eligibility,
                        "warnings": warnings,
                    }

                # Inspect views
                view_names = inspector.get_view_names(schema=schema)
                for vw in view_names:
                    report["mapping_summary"]["total_views"] += 1
                    report["mapping_summary"]["views"].append(f"{schema}.{vw}")
                    columns = inspector.get_columns(vw, schema=schema)

                    col_details = []
                    for col in columns:
                        col_details.append(
                            {
                                "name": col["name"],
                                "type": str(col["type"]),
                                "nullable": col.get("nullable", True),
                            }
                        )

                    view_row_count = None
                    if include_row_counts:
                        try:
                            quoted_schema = f'"{schema}"'
                            quoted_vw = f'"{vw}"'
                            res = conn.execute(text(f"SELECT COUNT(*) FROM {quoted_schema}.{quoted_vw}"))
                            view_row_count = res.scalar()
                        except Exception as e:
                            report["mapping_summary"]["warnings"].append(
                                f"Failed to get row count for view {schema}.{vw}: {str(e)}"
                            )

                    schema_data["views"][vw] = {
                        "columns": col_details,
                        "row_count": view_row_count,
                        "mapping_eligibility": "view_read_only",
                    }

                report["schemas"][schema] = schema_data

        return report

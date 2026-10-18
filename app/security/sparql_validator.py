"""SPARQL Query Security and Syntax-Aware Validator.

Enforces:
- AST parsing using RDFLib
- Strictly SELECT queries only (no updates, no CONSTRUCT/DESCRIBE/ASK)
- No federated queries (SERVICE clauses)
- No unapproved dataset clauses (FROM / FROM NAMED)
- Query size constraints
- Automatic LIMIT enforcement / capping
- Protection against multiple statement execution
"""

import re
from typing import Optional

from pyparsing.exceptions import ParseException
from rdflib.plugins.sparql.parser import parseQuery

from app.config import settings


class SPARQLValidationError(Exception):
    def __init__(self, message: str, code: str = "INVALID_SPARQL"):
        super().__init__(message)
        self.message = message
        self.code = code


class SPARQLValidator:
    def __init__(self, max_chars: int = 10000, max_results: Optional[int] = None):
        self.max_chars = max_chars
        self.max_results = max_results or settings.max_sparql_results

    def validate_and_constrain(self, sparql_query: str, requested_limit: Optional[int] = None) -> str:
        """Validate a SPARQL query against security rules and enforce result limits.

        Args:
            sparql_query: Raw SPARQL query string
            requested_limit: Optional caller limit

        Returns:
            Validated, sanitized, and limit-constrained SPARQL query string.

        Raises:
            SPARQLValidationError: If validation fails.
        """
        if not sparql_query or not sparql_query.strip():
            raise SPARQLValidationError("Query string cannot be empty.", code="EMPTY_QUERY")

        clean_query = sparql_query.strip()

        # 1. Check query size
        if len(clean_query) > self.max_chars:
            raise SPARQLValidationError(
                f"Query exceeds maximum allowed length of {self.max_chars} characters.",
                code="QUERY_TOO_LARGE",
            )

        # 2. Reject update and mutation operations via fast-fail regex check
        forbidden_update_pattern = r"\b(INSERT|DELETE|LOAD|CLEAR|CREATE|DROP|COPY|MOVE|ADD)\b"
        if re.search(forbidden_update_pattern, clean_query, re.IGNORECASE):
            raise SPARQLValidationError(
                "SPARQL update and mutation operations are strictly prohibited.",
                code="UPDATE_PROHIBITED",
            )

        # 3. Fast-fail check for federated SERVICE pattern
        if re.search(r"\bSERVICE\b", clean_query, re.IGNORECASE):
            raise SPARQLValidationError(
                "Federated queries using the 'SERVICE' keyword are strictly prohibited.",
                code="SERVICE_PROHIBITED",
            )

        # 4. Fast-fail check for FROM / FROM NAMED dataset clauses
        if re.search(r"\bFROM\s+(NAMED\s+)?<", clean_query, re.IGNORECASE):
            raise SPARQLValidationError(
                "Dataset clauses ('FROM' or 'FROM NAMED') are not permitted.",
                code="DATASET_CLAUSE_PROHIBITED",
            )

        # 5. Parse AST using RDFLib syntax-aware parser
        try:
            ast = parseQuery(clean_query)
        except ParseException as e:
            raise SPARQLValidationError(
                f"Malformed SPARQL syntax: {str(e)}",
                code="PARSE_ERROR",
            )
        except Exception as e:
            raise SPARQLValidationError(
                f"Failed to parse query: {str(e)}",
                code="INVALID_QUERY",
            )

        # 6. Verify root query form is SELECT
        if len(ast) < 2:
            raise SPARQLValidationError("Query missing body or expression.", code="INVALID_STRUCTURE")

        query_node = ast[1]
        node_name = getattr(query_node, "name", "")
        if "SelectQuery" not in node_name:
            raise SPARQLValidationError(
                f"Only read-only 'SELECT' queries are allowed (found '{node_name}').",
                code="ONLY_SELECT_ALLOWED",
            )

        # 7. Check for forbidden AST nodes via AST representation inspection
        ast_repr = repr(ast)
        if "ServiceGraphPattern" in ast_repr:
            raise SPARQLValidationError(
                "Federated queries using the 'SERVICE' keyword are strictly prohibited.",
                code="SERVICE_PROHIBITED",
            )
        if "DatasetClause" in ast_repr:
            raise SPARQLValidationError(
                "Dataset clauses ('FROM' or 'FROM NAMED') are not permitted.",
                code="DATASET_CLAUSE_PROHIBITED",
            )

        # 8. Enforce LIMIT
        effective_limit = self.max_results
        if requested_limit is not None and requested_limit > 0:
            effective_limit = min(requested_limit, self.max_results)

        # Check existing limit in AST
        has_existing_limit = False
        existing_limit_val = None
        if "limitoffset" in query_node.keys():
            lo = query_node["limitoffset"]
            if hasattr(lo, "get") and lo.get("limit") is not None:
                try:
                    existing_limit_val = int(lo.get("limit"))
                    has_existing_limit = True
                except (ValueError, TypeError):
                    pass

        # Constrain limit in query string
        if has_existing_limit and existing_limit_val is not None:
            if existing_limit_val > effective_limit:
                clean_query = re.sub(
                    r"\bLIMIT\s+\d+\b",
                    f"LIMIT {effective_limit}",
                    clean_query,
                    flags=re.IGNORECASE,
                )
        else:
            clean_query = f"{clean_query}\nLIMIT {effective_limit}"

        return clean_query

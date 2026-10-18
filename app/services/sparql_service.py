"""SPARQL execution service communicating with the Ontop VKG endpoint."""

import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.security.sparql_validator import SPARQLValidator


class SPARQLExecutionError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class SPARQLService:
    def __init__(self, endpoint_url: Optional[str] = None, timeout_seconds: Optional[int] = None):
        self.endpoint_url = endpoint_url or settings.ontop_endpoint_url
        self.timeout = timeout_seconds or settings.query_timeout_seconds
        self.validator = SPARQLValidator()

    async def check_health(self) -> bool:
        """Check if Ontop SPARQL endpoint is reachable."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                # Issue simple ASK or lightweight test query
                test_q = f"PREFIX : <{settings.vkg_base_iri}> SELECT ?s WHERE {{ ?s a :Movie }} LIMIT 1"
                resp = await client.post(
                    self.endpoint_url,
                    data={"query": test_q},
                    headers={"Accept": "application/sparql-results+json"},
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def execute_query(
        self,
        raw_query: str,
        requested_limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Validate, constrain, and execute a SPARQL query against Ontop.

        Args:
            raw_query: SPARQL query string
            requested_limit: Optional caller limit

        Returns:
            Dictionary containing: query, columns, row_count, results, execution_time_ms
        """
        # 1. Syntax-aware validation & limit constraint
        validated_query = self.validator.validate_and_constrain(raw_query, requested_limit)

        start_time = time.perf_counter()

        # 2. Execute via HTTP POST to Ontop
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.endpoint_url,
                    data={"query": validated_query},
                    headers={"Accept": "application/sparql-results+json"},
                )
        except httpx.TimeoutException:
            raise SPARQLExecutionError(
                f"Ontop query execution timed out after {self.timeout} seconds.",
                status_code=504,
            )
        except httpx.RequestError as e:
            raise SPARQLExecutionError(
                f"Failed to communicate with Ontop SPARQL endpoint: {str(e)}",
                status_code=502,
            )

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if response.status_code != 200:
            error_body = response.text[:500]
            raise SPARQLExecutionError(
                f"Ontop query error (HTTP {response.status_code}): {error_body}",
                status_code=502,
            )

        try:
            data = response.json()
        except Exception:
            raise SPARQLExecutionError("Ontop returned invalid JSON response.", status_code=502)

        vars_list: List[str] = data.get("head", {}).get("vars", [])
        raw_bindings: List[Dict[str, Any]] = data.get("results", {}).get("bindings", [])

        # Transform W3C SPARQL bindings to clean tabular list of dicts
        results: List[Dict[str, Any]] = []
        for binding in raw_bindings:
            row: Dict[str, Any] = {}
            for var in vars_list:
                item = binding.get(var)
                if item is not None:
                    row[var] = item.get("value")
                else:
                    row[var] = None
            results.append(row)

        return {
            "query": validated_query,
            "columns": vars_list,
            "row_count": len(results),
            "results": results,
            "execution_time_ms": duration_ms,
        }

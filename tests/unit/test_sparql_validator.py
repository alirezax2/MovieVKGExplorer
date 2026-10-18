"""Unit tests for SPARQL query security and validation."""

import pytest

from app.security.sparql_validator import SPARQLValidationError, SPARQLValidator


@pytest.fixture
def validator():
    return SPARQLValidator(max_chars=2000, max_results=100)


def test_valid_select_query_appends_limit(validator):
    q = "PREFIX : <https://example.org/movie-vkg/> SELECT ?m ?title WHERE { ?m a :Movie ; :title ?title }"
    res = validator.validate_and_constrain(q)
    assert "LIMIT 100" in res


def test_valid_select_query_respects_existing_lower_limit(validator):
    q = "PREFIX : <https://example.org/movie-vkg/> SELECT ?m WHERE { ?m a :Movie } LIMIT 10"
    res = validator.validate_and_constrain(q)
    assert "LIMIT 10" in res


def test_valid_select_query_caps_excessive_limit(validator):
    q = "PREFIX : <https://example.org/movie-vkg/> SELECT ?m WHERE { ?m a :Movie } LIMIT 5000"
    res = validator.validate_and_constrain(q)
    assert "LIMIT 100" in res


def test_empty_query_rejected(validator):
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain("   ")
    assert exc.value.code == "EMPTY_QUERY"


def test_query_too_large_rejected(validator):
    giant_q = "SELECT ?s WHERE { ?s ?p ?o } # " + ("x" * 2500)
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(giant_q)
    assert exc.value.code == "QUERY_TOO_LARGE"


def test_update_insert_rejected(validator):
    q = "INSERT DATA { <http://example.org/s> <http://example.org/p> 'val' }"
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(q)
    assert "prohibited" in exc.value.message.lower()


def test_update_delete_rejected(validator):
    q = "DELETE WHERE { ?s ?p ?o }"
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(q)
    assert "prohibited" in exc.value.message.lower()


def test_update_drop_rejected(validator):
    q = "DROP GRAPH <http://example.org/graph>"
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(q)
    assert "prohibited" in exc.value.message.lower()


def test_federated_service_rejected(validator):
    q = "SELECT * WHERE { SERVICE <http://evil.com/sparql> { ?s ?p ?o } }"
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(q)
    assert exc.value.code == "SERVICE_PROHIBITED"


def test_unapproved_dataset_clause_rejected(validator):
    q = "SELECT * FROM <http://example.org/graph> WHERE { ?s ?p ?o }"
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(q)
    assert exc.value.code == "DATASET_CLAUSE_PROHIBITED"


def test_non_select_ask_rejected(validator):
    q = "ASK { ?s ?p ?o }"
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(q)
    assert exc.value.code == "ONLY_SELECT_ALLOWED"


def test_malformed_syntax_rejected(validator):
    q = "SELECT ?s WHERE { ?s ?p }"  # missing object
    with pytest.raises(SPARQLValidationError) as exc:
        validator.validate_and_constrain(q)
    assert exc.value.code == "PARSE_ERROR"

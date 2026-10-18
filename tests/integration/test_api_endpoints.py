"""Integration tests for FastAPI application endpoints."""

from unittest.mock import AsyncMock, patch


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database_connected" in data
    assert "ontop_connected" in data


def test_ready_endpoint(client):
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert "ready" in data
    assert "checks" in data


def test_schema_endpoint(client, auth_headers):
    response = client.get("/schema", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["database_name"] == "movies_db"
    assert "public" in data["schemas"]


def test_ontology_endpoint(client, auth_headers):
    response = client.get("/ontology", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "ontology_ttl" in data
    assert "classes" in data
    assert "properties" in data
    class_iris = [c["iri"] for c in data["classes"]]
    assert any("Movie" in iri for iri in class_iris)


def test_query_endpoint_valid_sparql(client, auth_headers):
    query = "PREFIX : <https://example.org/movie-vkg/> SELECT ?m ?title WHERE { ?m a :Movie ; :title ?title } LIMIT 3"
    response = client.post("/query", json={"query": query}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] == 3
    assert len(data["results"]) == 3
    assert "title" in data["columns"]
    assert "m" in data["columns"]


def test_query_endpoint_rejects_update(client, auth_headers):
    query = "DROP GRAPH <http://example.org/data>"
    response = client.post("/query", json={"query": query}, headers=auth_headers)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


def test_query_endpoint_rejects_federated_service(client, auth_headers):
    query = "SELECT * WHERE { SERVICE <http://evil.com/sparql> { ?s ?p ?o } }"
    response = client.post("/query", json={"query": query}, headers=auth_headers)
    assert response.status_code == 400


@patch("app.services.llm_service.AsyncOpenAI")
def test_ask_endpoint_with_mocked_llm(mock_openai_cls, client, auth_headers):
    mock_instance = mock_openai_cls.return_value
    mock_instance.chat.completions.create = AsyncMock()

    # First call: generate_sparql
    mock_gen_choice = AsyncMock()
    mock_gen_choice.message.content = '{"sparql": "PREFIX : <https://example.org/movie-vkg/> SELECT ?m ?title WHERE { ?m a :Movie ; :title ?title } LIMIT 2", "explanation": "Retrieve top 2 movies"}'

    # Second call: synthesize_answer
    mock_syn_choice = AsyncMock()
    mock_syn_choice.message.content = "Here are the top 2 movies: Tears of Summit and Broken Eclipse."

    mock_resp1 = AsyncMock()
    mock_resp1.choices = [mock_gen_choice]

    mock_resp2 = AsyncMock()
    mock_resp2.choices = [mock_syn_choice]

    mock_instance.chat.completions.create.side_effect = [mock_resp1, mock_resp2]

    response = client.post(
        "/ask",
        json={"question": "What are 2 movies in the database?"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] == 2
    assert "Tears of Summit" in data["explanation"] or len(data["results"]) == 2
    assert "SELECT ?m ?title" in data["generated_sparql"]

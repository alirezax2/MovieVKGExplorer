"""Unit tests for LLM service response parsing and validation."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.llm_service import LLMService, LLMServiceError


def test_extract_json_clean():
    service = LLMService()
    raw = '{"sparql": "SELECT * WHERE { ?s ?p ?o }", "explanation": "Retrieve all triples"}'
    res = service._extract_json(raw)
    assert res["sparql"] == "SELECT * WHERE { ?s ?p ?o }"
    assert res["explanation"] == "Retrieve all triples"


def test_extract_json_markdown_fences():
    service = LLMService()
    raw = '```json\n{\n  "sparql": "SELECT ?title WHERE { ?m :title ?title }",\n  "explanation": "Movie titles"\n}\n```'
    res = service._extract_json(raw)
    assert "SELECT ?title" in res["sparql"]
    assert res["explanation"] == "Movie titles"


def test_extract_json_with_surrounding_commentary():
    service = LLMService()
    raw = 'Here is your query:\n{"sparql": "SELECT ?m WHERE { ?m a :Movie }", "explanation": "Find movies"}\nHope this helps!'
    res = service._extract_json(raw)
    assert res["sparql"] == "SELECT ?m WHERE { ?m a :Movie }"


def test_extract_json_malformed_raises_error():
    service = LLMService()
    raw = "I am sorry, but I cannot answer that."
    with pytest.raises(LLMServiceError) as exc:
        service._extract_json(raw)
    assert exc.value.status_code == 502


@pytest.mark.asyncio
async def test_short_question_rejected():
    service = LLMService()
    with pytest.raises(LLMServiceError) as exc:
        await service.generate_sparql("hi")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_mocked_llm_generation():
    service = LLMService()
    mock_choice = MagicMock()
    mock_choice.message.content = '{"sparql": "PREFIX : <https://example.org/movie-vkg/> SELECT ?m WHERE { ?m a :Movie } LIMIT 5", "explanation": "Select 5 movies"}'
    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]

    service.client.chat.completions.create = AsyncMock(return_value=mock_resp)

    res = await service.generate_sparql("Show me 5 movies")
    assert "SELECT ?m" in res["sparql"]
    assert res["explanation"] == "Select 5 movies"

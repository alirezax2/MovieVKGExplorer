"""Integration tests verifying Ontop VKG queries against live PostgreSQL."""

import pytest

from app.services.sparql_service import SPARQLService


@pytest.mark.asyncio
async def test_ontop_movie_query():
    service = SPARQLService()
    q = "PREFIX : <https://example.org/movie-vkg/> SELECT ?m ?title ?rating WHERE { ?m a :Movie ; :title ?title ; :rating ?rating } LIMIT 5"
    res = await service.execute_query(q)
    assert res["row_count"] == 5
    assert len(res["results"]) == 5
    for row in res["results"]:
        assert row["title"] is not None
        assert float(row["rating"]) >= 1.0


@pytest.mark.asyncio
async def test_ontop_class_subclass_hierarchy_query():
    service = SPARQLService()
    q = """
    PREFIX : <https://example.org/movie-vkg/>
    SELECT ?className ?subclassName WHERE {
        ?sc a :MovieSubclass ;
            :name ?subclassName ;
            :belongsToClass ?c .
        ?c a :MovieClass ;
           :name ?className .
    }
    ORDER BY ?className ?subclassName
    LIMIT 10
    """
    res = await service.execute_query(q)
    assert res["row_count"] == 10
    assert len(res["results"]) == 10
    assert "className" in res["columns"]
    assert "subclassName" in res["columns"]


@pytest.mark.asyncio
async def test_ontop_metadata_definition_linkage():
    service = SPARQLService()
    q = """
    PREFIX : <https://example.org/movie-vkg/>
    SELECT ?defName ?defType ?metaid WHERE {
        ?d a :MetadataDefinition ;
           :name ?defName ;
           :entityType ?defType ;
           :metaid ?metaid .
    }
    LIMIT 5
    """
    res = await service.execute_query(q)
    assert res["row_count"] == 5
    assert len(res["results"]) == 5

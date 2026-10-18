"""Integration tests proving SPARQL and SQL results strictly agree."""

import pytest
from sqlalchemy import create_engine, text

from app.config import settings
from app.services.sparql_service import SPARQLService


@pytest.mark.asyncio
async def test_sparql_sql_count_agreement():
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        sql_count = conn.execute(text("SELECT COUNT(*) FROM object")).scalar()

    service = SPARQLService()
    sparql_q = "PREFIX : <https://example.org/movie-vkg/> SELECT (COUNT(?m) AS ?count) WHERE { ?m a :Movie }"
    res = await service.execute_query(sparql_q)
    sparql_count = int(res["results"][0]["count"])

    assert sql_count == sparql_count
    assert sql_count == 1000


@pytest.mark.asyncio
async def test_sparql_sql_top_rated_movies_agreement():
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT title, rating, release_year FROM object ORDER BY rating DESC, title ASC LIMIT 3")
        ).fetchall()
        sql_top = [(r[0], float(r[1]), int(r[2])) for r in rows]

    service = SPARQLService()
    sparql_q = """
    PREFIX : <https://example.org/movie-vkg/>
    SELECT ?title ?rating ?year WHERE {
        ?m a :Movie ;
           :title ?title ;
           :rating ?rating ;
           :releaseYear ?year .
    }
    ORDER BY DESC(?rating) ?title
    LIMIT 3
    """
    res = await service.execute_query(sparql_q)
    sparql_top = [(row["title"], float(row["rating"]), int(row["year"])) for row in res["results"]]

    assert sql_top == sparql_top


@pytest.mark.asyncio
async def test_sparql_sql_taxonomy_class_count_agreement():
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        sql_class_count = conn.execute(text("SELECT COUNT(*) FROM class")).scalar()
        sql_subclass_count = conn.execute(text("SELECT COUNT(*) FROM subclass")).scalar()

    service = SPARQLService()
    sparql_class_q = "PREFIX : <https://example.org/movie-vkg/> SELECT (COUNT(?c) AS ?count) WHERE { ?c a :MovieClass }"
    sparql_subclass_q = (
        "PREFIX : <https://example.org/movie-vkg/> SELECT (COUNT(?sc) AS ?count) WHERE { ?sc a :MovieSubclass }"
    )

    res_c = await service.execute_query(sparql_class_q)
    res_sc = await service.execute_query(sparql_subclass_q)

    assert int(res_c["results"][0]["count"]) == sql_class_count
    assert int(res_sc["results"][0]["count"]) == sql_subclass_count

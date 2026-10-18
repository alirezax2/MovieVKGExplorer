#!/usr/bin/env python3
"""Mapping and Ontology Generator.

Reads the relational database schema metadata and produces:
- ontop/ontology.ttl (OWL/Turtle ontology)
- ontop/mapping.obda (Ontop OBDA mapping file)
- ontop/ontop.properties (Database connection properties)
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings

ONTOLOGY_TEMPLATE = """@prefix : <{base_iri}> .
@prefix mv: <{base_iri}> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<{base_iri}> a owl:Ontology ;
    rdfs:label "Movie Relational Metadata Virtual Knowledge Graph Ontology"@en ;
    rdfs:comment "Ontology defining movies, taxonomy classes, subclasses, definitions, and relationships derived from the relational movie metadata database."@en ;
    owl:versionInfo "1.0.0" .

#################################################################
#    Classes
#################################################################

mv:Movie a owl:Class ;
    rdfs:label "Movie"@en ;
    rdfs:comment "A movie entity representing a film record with attributes like title, release year, director, rating, runtime, and language."@en .

mv:MovieClass a owl:Class ;
    rdfs:label "Movie Class"@en ;
    rdfs:comment "A primary top-level taxonomy category (e.g., Action, Adventure, Drama, Comedy, Sci-Fi)."@en .

mv:MovieSubclass a owl:Class ;
    rdfs:label "Movie Subclass"@en ;
    rdfs:comment "A granular subcategory strictly belonging to a parent Movie Class (e.g., Superhero, Martial Arts, Romantic Comedy)."@en .

mv:ClassSubclassRelation a owl:Class ;
    rdfs:label "Class Subclass Relation"@en ;
    rdfs:comment "Explicit relational mapping detailing how a subclass relates taxonomically to its parent class."@en .

mv:MetadataDefinition a owl:Class ;
    rdfs:label "Metadata Definition"@en ;
    rdfs:comment "Semantic definitions, specifications, namespaces, and data types for metadata concepts."@en .

mv:MetadataRegistryEntry a owl:Class ;
    rdfs:label "Metadata Registry Entry"@en ;
    rdfs:comment "Central taxonomy identifier token registered in the unified metadata registry."@en .

#################################################################
#    Object Properties
#################################################################

mv:hasGenreClass a owl:ObjectProperty ;
    rdfs:label "has genre class"@en ;
    rdfs:comment "Links a movie to its assigned top-level movie class."@en ;
    rdfs:domain mv:Movie ;
    rdfs:range mv:MovieClass .

mv:hasSubclass a owl:ObjectProperty ;
    rdfs:label "has subclass"@en ;
    rdfs:comment "Links a movie to its specific granular subclass, or links a relation to its subclass."@en ;
    rdfs:range mv:MovieSubclass .

mv:belongsToClass a owl:ObjectProperty ;
    rdfs:label "belongs to class"@en ;
    rdfs:comment "Links a movie subclass directly to its parent movie class."@en ;
    rdfs:domain mv:MovieSubclass ;
    rdfs:range mv:MovieClass .

mv:hasParentClass a owl:ObjectProperty ;
    rdfs:label "has parent class"@en ;
    rdfs:comment "Links a class-subclass relation to the parent movie class."@en ;
    rdfs:domain mv:ClassSubclassRelation ;
    rdfs:range mv:MovieClass .

mv:hasMetadataRegistry a owl:ObjectProperty ;
    rdfs:label "has metadata registry"@en ;
    rdfs:comment "Links an entity (e.g., Movie, Class, Subclass) to its unified metadata registry token."@en ;
    rdfs:range mv:MetadataRegistryEntry .

mv:appliesToRegistry a owl:ObjectProperty ;
    rdfs:label "applies to registry"@en ;
    rdfs:comment "Links a metadata definition to its corresponding metadata registry token."@en ;
    rdfs:domain mv:MetadataDefinition ;
    rdfs:range mv:MetadataRegistryEntry .

#################################################################
#    Datatype Properties
#################################################################

mv:title a owl:DatatypeProperty ;
    rdfs:label "title"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:string .

mv:releaseYear a owl:DatatypeProperty ;
    rdfs:label "release year"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:integer .

mv:director a owl:DatatypeProperty ;
    rdfs:label "director"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:string .

mv:description a owl:DatatypeProperty ;
    rdfs:label "description"@en ;
    rdfs:range xsd:string .

mv:runtimeMinutes a owl:DatatypeProperty ;
    rdfs:label "runtime minutes"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:integer .

mv:rating a owl:DatatypeProperty ;
    rdfs:label "rating"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:decimal .

mv:originalLanguage a owl:DatatypeProperty ;
    rdfs:label "original language"@en ;
    rdfs:domain mv:Movie ;
    rdfs:range xsd:string .

mv:name a owl:DatatypeProperty ;
    rdfs:label "name"@en ;
    rdfs:range xsd:string .

mv:relationType a owl:DatatypeProperty ;
    rdfs:label "relation type"@en ;
    rdfs:domain mv:ClassSubclassRelation ;
    rdfs:range xsd:string .

mv:metaid a owl:DatatypeProperty ;
    rdfs:label "metaid"@en ;
    rdfs:range xsd:string .

mv:entityType a owl:DatatypeProperty ;
    rdfs:label "entity type"@en ;
    rdfs:range xsd:string .

mv:dataType a owl:DatatypeProperty ;
    rdfs:label "data type"@en ;
    rdfs:domain mv:MetadataDefinition ;
    rdfs:range xsd:string .

mv:namespace a owl:DatatypeProperty ;
    rdfs:label "namespace"@en ;
    rdfs:domain mv:MetadataDefinition ;
    rdfs:range xsd:string .

mv:version a owl:DatatypeProperty ;
    rdfs:label "version"@en ;
    rdfs:domain mv:MetadataDefinition ;
    rdfs:range xsd:string .
"""

MAPPING_TEMPLATE = """[PrefixDeclaration]
:		{base_iri}
mv:		{base_iri}
owl:		http://www.w3.org/2002/07/owl#
rdf:		http://www.w3.org/1999/02/22-rdf-syntax-ns#
rdfs:		http://www.w3.org/2000/01/rdf-schema#
xsd:		http://www.w3.org/2001/XMLSchema#

[MappingDeclaration] @collection [[
mappingId	mapping-movie-objects
target		:movie/{{object_id}} a :Movie ; :title {{title}}^^xsd:string ; :releaseYear {{release_year}}^^xsd:integer ; :director {{director}}^^xsd:string ; :description {{description}}^^xsd:string ; :runtimeMinutes {{runtime_minutes}}^^xsd:integer ; :rating {{rating}}^^xsd:decimal ; :originalLanguage {{original_language}}^^xsd:string ; :hasGenreClass :class/{{class}} ; :hasSubclass :subclass/{{subclass}} ; :hasMetadataRegistry :registry/{{metaid}} .
source		SELECT object_id, title, release_year, director, description, "class", subclass, metaid, runtime_minutes, rating, original_language FROM "public"."object"

mappingId	mapping-movie-classes
target		:class/{{metaid}} a :MovieClass ; :name {{name}}^^xsd:string ; :description {{description}}^^xsd:string ; rdfs:label {{name}}^^xsd:string ; :metaid {{metaid}}^^xsd:string .
source		SELECT metaid, name, description FROM "public"."class"

mappingId	mapping-movie-subclasses
target		:subclass/{{metaid}} a :MovieSubclass ; :name {{name}}^^xsd:string ; :description {{description}}^^xsd:string ; :belongsToClass :class/{{class_metaid}} ; rdfs:label {{name}}^^xsd:string ; :metaid {{metaid}}^^xsd:string .
source		SELECT metaid, class_metaid, name, description FROM "public"."subclass"

mappingId	mapping-class-subclass-relations
target		:relation/{{relation_id}} a :ClassSubclassRelation ; :hasParentClass :class/{{class_metaid}} ; :hasSubclass :subclass/{{subclass_metaid}} ; :relationType {{relation_type}}^^xsd:string ; :description {{description}}^^xsd:string .
source		SELECT relation_id, class_metaid, subclass_metaid, relation_type, description FROM "public"."relation_class_subclass"

mappingId	mapping-metadata-definitions
target		:definition/{{definition_id}} a :MetadataDefinition ; :name {{name}}^^xsd:string ; :entityType {{entity_type}}^^xsd:string ; :description {{description}}^^xsd:string ; :dataType {{data_type}}^^xsd:string ; :namespace {{namespace}}^^xsd:string ; :version {{version}}^^xsd:string ; :appliesToRegistry :registry/{{metaid}} ; :metaid {{metaid}}^^xsd:string .
source		SELECT definition_id, metaid, name, entity_type, description, data_type, namespace, version FROM "public"."definition"

mappingId	mapping-metadata-registry
target		:registry/{{metaid}} a :MetadataRegistryEntry ; :metaid {{metaid}}^^xsd:string ; :entityType {{entity_type}}^^xsd:string .
source		SELECT metaid, entity_type FROM "public"."metadata_registry"
]]
"""


def main():
    parser = argparse.ArgumentParser(description="Generate Ontop ontology and OBDA mapping files.")
    parser.add_argument("--output-dir", default="ontop", help="Target output directory (default: ontop)")
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    base_iri = settings.vkg_base_iri
    if not base_iri.endswith("/"):
        base_iri += "/"

    print(f"Generating VKG mappings with base IRI: {base_iri}")

    # 1. Write ontology.ttl
    ontology_content = ONTOLOGY_TEMPLATE.format(base_iri=base_iri)
    ontology_path = out_dir / "ontology.ttl"
    with open(ontology_path, "w", encoding="utf-8") as f:
        f.write(ontology_content)
    print(f"  Created: {ontology_path}")

    # 2. Write mapping.obda
    mapping_content = MAPPING_TEMPLATE.format(base_iri=base_iri)
    mapping_path = out_dir / "mapping.obda"
    with open(mapping_path, "w", encoding="utf-8") as f:
        f.write(mapping_content)
    print(f"  Created: {mapping_path}")

    # 3. Write ontop.properties
    props_path = out_dir / "ontop.properties"
    props_content = f"""# Ontop VKG Connection Configuration
jdbc.url=jdbc:postgresql://postgres:5432/{settings.postgres_db}
jdbc.driver=org.postgresql.Driver
jdbc.user={settings.postgres_user}
jdbc.password={settings.postgres_password}

# Ontop Optimization & Semantics
ontop.inferDefaultDatatype=true
"""
    with open(props_path, "w", encoding="utf-8") as f:
        f.write(props_content)
    print(f"  Created: {props_path}")

    print("Mapping and ontology generation completed successfully.")


if __name__ == "__main__":
    main()

"""Ontology Service for vocabulary discovery and metadata provision."""

from pathlib import Path
from typing import Any, Dict, List, Optional

import rdflib

from app.config import settings


class OntologyService:
    def __init__(self, ontology_path: Optional[str] = None):
        self.ontology_path = Path(ontology_path or "ontop/ontology.ttl")
        self._graph: Optional[rdflib.Graph] = None
        self._classes: Optional[List[Dict[str, Any]]] = None
        self._properties: Optional[List[Dict[str, Any]]] = None

    def get_graph(self) -> rdflib.Graph:
        if self._graph is None:
            if not self.ontology_path.exists():
                raise FileNotFoundError(f"Ontology file not found at {self.ontology_path}")
            g = rdflib.Graph()
            g.parse(str(self.ontology_path), format="turtle")
            self._graph = g
        return self._graph

    def get_raw_turtle(self) -> str:
        if not self.ontology_path.exists():
            return ""
        with open(self.ontology_path, "r", encoding="utf-8") as f:
            return f.read()

    def get_classes(self) -> List[Dict[str, Any]]:
        if self._classes is not None:
            return self._classes

        g = self.get_graph()
        classes = []
        for s in g.subjects(rdflib.RDF.type, rdflib.OWL.Class):
            label = g.value(s, rdflib.RDFS.label) or s.split("/")[-1]
            comment = g.value(s, rdflib.RDFS.comment)
            classes.append(
                {
                    "iri": str(s),
                    "label": str(label),
                    "comment": str(comment) if comment else None,
                }
            )
        self._classes = sorted(classes, key=lambda x: x["label"])
        return self._classes

    def get_properties(self) -> List[Dict[str, Any]]:
        if self._properties is not None:
            return self._properties

        g = self.get_graph()
        props = []

        # Object Properties
        for s in g.subjects(rdflib.RDF.type, rdflib.OWL.ObjectProperty):
            label = g.value(s, rdflib.RDFS.label) or s.split("/")[-1]
            comment = g.value(s, rdflib.RDFS.comment)
            domain = g.value(s, rdflib.RDFS.domain)
            prop_range = g.value(s, rdflib.RDFS.range)
            props.append(
                {
                    "iri": str(s),
                    "label": str(label),
                    "property_type": "ObjectProperty",
                    "domain": str(domain) if domain else None,
                    "range": str(prop_range) if prop_range else None,
                    "comment": str(comment) if comment else None,
                }
            )

        # Datatype Properties
        for s in g.subjects(rdflib.RDF.type, rdflib.OWL.DatatypeProperty):
            label = g.value(s, rdflib.RDFS.label) or s.split("/")[-1]
            comment = g.value(s, rdflib.RDFS.comment)
            domain = g.value(s, rdflib.RDFS.domain)
            prop_range = g.value(s, rdflib.RDFS.range)
            props.append(
                {
                    "iri": str(s),
                    "label": str(label),
                    "property_type": "DatatypeProperty",
                    "domain": str(domain) if domain else None,
                    "range": str(prop_range) if prop_range else None,
                    "comment": str(comment) if comment else None,
                }
            )

        self._properties = sorted(props, key=lambda x: x["label"])
        return self._properties

    def get_prompt_context(self) -> str:
        """Return a structured, LLM-ready vocabulary summary for accurate SPARQL generation."""
        classes = self.get_classes()
        properties = self.get_properties()

        class_lines = []
        for c in classes:
            desc = f" - {c['comment']}" if c["comment"] else ""
            class_lines.append(f"  * :{c['iri'].split('/')[-1]} ({c['label']}){desc}")

        prop_lines = []
        for p in properties:
            name = f":{p['iri'].split('/')[-1]}"
            typ = p["property_type"]
            domain = f" [Domain: :{p['domain'].split('/')[-1]}]" if p["domain"] else ""
            prange = f" [Range: {p['range'].split('/')[-1] if '/' in p['range'] else p['range']}]" if p["range"] else ""
            desc = f" // {p['comment']}" if p["comment"] else ""
            prop_lines.append(f"  * {name} ({typ}){domain}{prange}{desc}")

        return (
            f"Base Namespace Prefix: PREFIX : <{settings.vkg_base_iri}>\n\n"
            f"Available OWL Classes:\n" + "\n".join(class_lines) + "\n\n"
            "Available RDF Properties:\n" + "\n".join(prop_lines)
        )

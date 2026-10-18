#!/usr/bin/env python3
"""Ontology and OBDA Mapping Validation Script.

Validates:
1. Turtle syntax and OWL structure using RDFLib.
2. OBDA mapping structure and prefix integrity.
3. Ontop native validation against PostgreSQL using Ontop Docker CLI.
"""

import argparse
import subprocess
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import rdflib


def validate_ontology_ttl(ontology_path: Path) -> int:
    print(f"1. Validating Turtle ontology syntax at: {ontology_path}")
    if not ontology_path.exists():
        raise FileNotFoundError(f"Ontology file not found at: {ontology_path}")

    g = rdflib.Graph()
    g.parse(str(ontology_path), format="turtle")
    triple_count = len(g)
    print(f"   [PASS] Ontology syntax is valid. Loaded {triple_count} triples.")

    # Count classes and properties
    classes = list(g.subjects(rdflib.RDF.type, rdflib.OWL.Class))
    obj_props = list(g.subjects(rdflib.RDF.type, rdflib.OWL.ObjectProperty))
    data_props = list(g.subjects(rdflib.RDF.type, rdflib.OWL.DatatypeProperty))

    print(
        f"   Defined {len(classes)} OWL Classes, {len(obj_props)} Object Properties, {len(data_props)} Datatype Properties."
    )
    return triple_count


def validate_obda_file(mapping_path: Path) -> int:
    print(f"\n2. Validating OBDA mapping file syntax at: {mapping_path}")
    if not mapping_path.exists():
        raise FileNotFoundError(f"OBDA mapping file not found at: {mapping_path}")

    with open(mapping_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "[PrefixDeclaration]" not in content:
        raise ValueError("Missing [PrefixDeclaration] section in OBDA file.")
    if "[MappingDeclaration]" not in content:
        raise ValueError("Missing [MappingDeclaration] section in OBDA file.")

    # Count mapping blocks
    mapping_count = content.count("mappingId")
    print(f"   [PASS] OBDA mapping syntax has proper sections. Contains {mapping_count} mappings.")
    return mapping_count


def validate_ontop_cli(ontop_dir: Path) -> bool:
    print("\n3. Validating Ontop OBDA mappings against live PostgreSQL database...")
    abs_ontop_dir = ontop_dir.resolve()
    abs_jdbc_dir = (ontop_dir / "jdbc").resolve()

    cmd = [
        "docker",
        "run",
        "--rm",
        "--network",
        "movie_metadata_network",
        "-v",
        f"{abs_ontop_dir}:/opt/ontop/input",
        "-v",
        f"{abs_jdbc_dir}:/opt/ontop/jdbc",
        "ontop/ontop:5.5.0",
        "ontop",
        "validate",
        "-t",
        "/opt/ontop/input/ontology.ttl",
        "-m",
        "/opt/ontop/input/mapping.obda",
        "-p",
        "/opt/ontop/input/ontop.properties",
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("   [PASS] Ontop CLI validation succeeded against PostgreSQL!")
        if "Validation completed" in res.stdout:
            print("   Output: Validation completed successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   [FAIL] Ontop CLI validation failed with error:\n{e.stderr or e.stdout}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"   [WARN] Could not run Dockerized Ontop CLI validation: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Validate Ontop ontology and OBDA mappings.")
    parser.add_argument("--ontop-dir", default="ontop", help="Ontop files directory (default: ontop)")
    parser.add_argument("--skip-docker", action="store_true", help="Skip Dockerized ontop validate command")
    args = parser.parse_args()

    ontop_dir = Path(args.ontop_dir)
    ontology_path = ontop_dir / "ontology.ttl"
    mapping_path = ontop_dir / "mapping.obda"

    print("================================================================================")
    print("STAGE B: ONTOLOGY AND OBDA MAPPING VALIDATION")
    print("================================================================================")

    try:
        validate_ontology_ttl(ontology_path)
        validate_obda_file(mapping_path)

        if not args.skip_docker:
            success = validate_ontop_cli(ontop_dir)
            if not success:
                sys.exit(1)

        print("\n================================================================================")
        print("ALL ONTOLOGY AND MAPPING VALIDATION CHECKS PASSED.")
        print("================================================================================")
    except Exception as e:
        print(f"\nVALIDATION FAILED: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

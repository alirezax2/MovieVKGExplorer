FROM ontop/ontop:5.5.0

COPY ontology.ttl mapping.obda ontop.properties /opt/ontop/input/

# Postgres JDBC driver: download at build time, no dependency on a gitignored jar
ADD https://jdbc.postgresql.org/download/postgresql-42.7.4.jar /opt/ontop/jdbc/postgresql.jar

FROM ontop/ontop:5.5.0

USER root

COPY ontology.ttl mapping.obda ontop.properties /opt/ontop/input/

# Postgres JDBC driver: download at build time
ADD https://jdbc.postgresql.org/download/postgresql-42.7.4.jar /opt/ontop/jdbc/postgresql.jar

# Fix permissions so non-root 'ontop' user can read the JDBC driver and input files
RUN chmod -R 755 /opt/ontop/input /opt/ontop/jdbc && \
    chown -R ontop:ontop /opt/ontop/input /opt/ontop/jdbc

USER ontop

from neo4j import GraphDatabase
import os

class Neo4jClient:
    def __init__(self):
        # Defaulting to the credentials configured in docker-compose.yml
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "production_password")
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def clear_database(self):
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            print("Database cleared.")

    def init_schema(self):
        with self.driver.session() as session:
            # Structural constraints
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (r:Repository) REQUIRE r.id IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (d:Directory) REQUIRE d.path IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (f:File) REQUIRE f.path IS UNIQUE")
            
            # Semantic constraints
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (s:Symbol) REQUIRE s.id IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (c:Class) REQUIRE c.id IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (func:Function) REQUIRE func.id IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (v:Variable) REQUIRE v.id IS UNIQUE")
            
            # Fast lookup indexes
            session.run("CREATE INDEX file_rel_path IF NOT EXISTS FOR (f:File) ON (f.relative_path, f.repo_id)")
            session.run("CREATE INDEX symbol_name IF NOT EXISTS FOR (s:Symbol) ON (s.name)")
            session.run("CREATE INDEX func_name IF NOT EXISTS FOR (func:Function) ON (func.name)")
            print("Schema initialized.")

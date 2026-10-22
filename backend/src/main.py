import os
from src.db.neo4j_client import Neo4jClient
from src.ingester.worker import RepositoryIngester

if __name__ == "__main__":
    # In a real production setup, TARGET_REPO would come from a message queue
    # Here, we default to analyzing the backend's own source code.
    TARGET_REPO = os.getenv("TARGET_REPO", "/Users/siddeshhn/implication/backend")

    print(f"Connecting to Neo4j...")
    db = Neo4jClient()
    
    try:
        # Initialize graph constraints
        db.init_schema()

        # Start ingestion
        ingester = RepositoryIngester(db)
        ingester.process_repository(TARGET_REPO)

    except Exception as e:
        print(f"An error occurred during ingestion: {e}")
        print("Ensure Neo4j is running via `docker-compose up -d`")
    finally:
        db.close()

import os
from src.parser.scip_parser import SCIPParser
from src.ingester.graph_builder import GraphBuilder
from src.ingester.scip_generator import SCIPGenerator
from src.ingester.vector_generator import VectorGenerator

class RepositoryIngester:
    def __init__(self, db_client):
        self.db = db_client
        self.graph_builder = GraphBuilder(self.db)
        self.scip_generator = SCIPGenerator()
        self.vector_generator = VectorGenerator(self.db)
        self.scip_parser = SCIPParser(self.db)

    def process_repository(self, repo_path, repo_id, repo_name):
        """
        Orchestrates the ingestion pipeline for a repository.
        """
        print(f"Starting ingestion for repository: {repo_name} ({repo_id})")

        # 1. Clean legacy nodes
        self.graph_builder.clean_legacy_graph(repo_id)

        # 2. Build Directory and File nodes
        self.graph_builder.build_directory_file_graph(repo_path, repo_id, repo_name)

        # 3. Generate SCIP index files via Docker
        self.scip_generator.generate_scip_indexes(repo_path)

        # 4. Parse SCIP and draw structural edges
        scip_files = [f for f in os.listdir(repo_path) if f.endswith('.scip')]
        if scip_files:
            for scip_file in scip_files:
                scip_full_path = os.path.join(repo_path, scip_file)
                print(f"Parsing pure SCIP index: {scip_file}...")
                self.scip_parser.parse_and_ingest(scip_full_path, repo_id)
        else:
            print(f"No .scip indexes were successfully generated for {repo_name}. No semantic nodes were ingested.")

        # 5. Generate Semantic Vectors
        self.vector_generator.generate_vectors(repo_path, repo_id)

        print(f"Finished ingestion for {repo_name}")

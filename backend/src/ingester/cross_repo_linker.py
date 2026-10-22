import os
from src.db.neo4j_client import Neo4jClient

class CrossRepoLinker:
    def __init__(self, db_client: Neo4jClient):
        self.db = db_client

    def run_semantic_linking(self):
        """
        Runs an ANN (Approximate Nearest Neighbor) cosine similarity calculation 
        across chunks from different repos using Neo4j's native vector index.
        """
        print("Running Semantic Cross-Repo Linker...")
        
        # We leverage the ANN index (chunk_vector) that was already created during ingestion.
        # For every chunk in the database, we query the index for its top 5 nearest neighbors.
        # If the neighbor is from a different repository and the similarity score is > 0.75, 
        # we consider it a cross-repo architectural link.
        
        query = """
        // 1. Iterate through every code chunk in the system
        MATCH (c1:Chunk)
        
        // 2. Query the ANN Vector Index for the closest semantic matches
        CALL db.index.vector.queryNodes('chunk_vector', 5, c1.embedding) YIELD node AS c2, score
        
        // 3. Filter for High Confidence and Cross-Repo ONLY
        WHERE c2.repo_id <> c1.repo_id AND score > 0.75
        
        // 4. Trace the chunks back to their parent File nodes
        WITH c1, c2, score
        MATCH (f1:File {repo_id: c1.repo_id}) 
        WHERE f1.relative_path = c1.filepath OR f1.path ENDS WITH c1.filepath
        
        MATCH (f2:File {repo_id: c2.repo_id}) 
        WHERE f2.relative_path = c2.filepath OR f2.path ENDS WITH c2.filepath
        
        // 5. Inject the definitive Cross-Repo edge with metadata always written
        MERGE (f1)-[fr:CROSS_REPO_LINK]->(f2)
        ON CREATE SET fr.method = 'cosine', fr.confidence = score
        ON MATCH SET fr.method = 'cosine', fr.confidence = score
        
        RETURN count(fr) as links_processed
        """
        
        try:
            with self.db.driver.session() as session:
                result = session.run(query)
                record = result.single()
                links = record["links_processed"] if record else 0
                print(f"Successfully processed {links} potential cross-repo semantic links!")
        except Exception as e:
            print(f"Failed to run semantic linker: {e}")
            
    def link_all(self):
        self.run_semantic_linking()

if __name__ == "__main__":
    db = Neo4jClient()
    linker = CrossRepoLinker(db)
    linker.link_all()

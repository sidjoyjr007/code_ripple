import os

IGNORED_DIRS = {
    'node_modules', 'venv', '.venv', '__pycache__', '.pytest_cache', 
    '.git', 'dist', 'build', '.next', 'coverage', '.tox', '.mypy_cache', '.ruff_cache'
}

IGNORED_EXTENSIONS = {
    '.pyc', '.pyo', '.pyd', '.DS_Store', '.swp', '.tmp'
}

class GraphBuilder:
    def __init__(self, db_client):
        self.db = db_client

    def clean_legacy_graph(self, repo_id):
        print(f"Cleaning up legacy graph nodes and edges for {repo_id}...")
        with self.db.driver.session() as session:
            session.run("""
                MATCH (n {repo_id: $repo_id})
                WHERE NOT n:Repository
                DETACH DELETE n
            """, repo_id=repo_id)

    def build_directory_file_graph(self, repo_path, repo_id, repo_name):
        dir_nodes = []
        dir_edges = []
        file_nodes = []
        
        for root, dirs, files in os.walk(repo_path):
            # Prune ignored directories in-place so os.walk does not traverse them
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith('.')]
            
            dir_name = os.path.basename(root) if root != repo_path else repo_name
            dir_nodes.append({"path": root, "repo_id": repo_id, "name": dir_name})

            parent_dir = os.path.dirname(root)
            if parent_dir and parent_dir.startswith(repo_path) and root != repo_path:
                dir_edges.append({"parent": parent_dir, "child": root, "repo_id": repo_id})

            for file_name in files:
                if file_name.startswith('.'):
                    continue
                    
                extension = os.path.splitext(file_name)[1].lower()
                if extension in IGNORED_EXTENSIONS:
                    continue
                    
                file_path = os.path.join(root, file_name)
                relative_path = os.path.relpath(file_path, repo_path)
                
                file_nodes.append({
                    "dir_path": root,
                    "file_path": file_path,
                    "file_name": file_name,
                    "extension": extension,
                    "relative_path": relative_path,
                    "repo_id": repo_id
                })

        with self.db.driver.session() as session:
            # 1. Ingest Directory nodes in batch
            if dir_nodes:
                session.run("""
                    UNWIND $batch AS row
                    MERGE (d:Directory {path: row.path, repo_id: row.repo_id})
                    SET d.name = row.name
                """, batch=dir_nodes)

            # Link Root Directory to Repository
            session.run("""
                MATCH (r:Repository {id: $repo_id}), (d:Directory {path: $root_path, repo_id: $repo_id})
                MERGE (r)-[:HAS_ROOT]->(d)
            """, repo_id=repo_id, root_path=repo_path)

            # 2. Ingest Directory -> Directory hierarchy edges in batch
            if dir_edges:
                session.run("""
                    UNWIND $batch AS row
                    MATCH (p:Directory {path: row.parent, repo_id: row.repo_id}), (c:Directory {path: row.child, repo_id: row.repo_id})
                    MERGE (p)-[:CONTAINS]->(c)
                """, batch=dir_edges)

            # 3. Ingest File nodes and Directory -> File edges in batches of 500
            batch_size = 500
            for i in range(0, len(file_nodes), batch_size):
                chunk = file_nodes[i:i + batch_size]
                session.run("""
                    UNWIND $batch AS row
                    MATCH (d:Directory {path: row.dir_path, repo_id: row.repo_id})
                    MERGE (f:File {path: row.file_path, repo_id: row.repo_id})
                    SET f.name = row.file_name,
                        f.extension = row.extension,
                        f.relative_path = row.relative_path
                    MERGE (d)-[:CONTAINS]->(f)
                """, batch=chunk)
                
        print(f"Ingested {len(dir_nodes)} directories and {len(file_nodes)} files for {repo_name}.")

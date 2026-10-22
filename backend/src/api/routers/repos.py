from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import uuid
import os
from ..schemas import RepositoryResponse, RepositoryBase
from ...db.neo4j_client import Neo4jClient

import shutil
import subprocess
from ...ingester.worker import RepositoryIngester

router = APIRouter(prefix="/repos", tags=["Repositories"])
db_client = None

def get_db():
    global db_client
    if not db_client:
        db_client = Neo4jClient()
    return db_client

def dummy_ingest_repo(repo_id: str, url: str, repo_name: str):
    print(f"Real ingestion started for {repo_id}: {url}")
    db = get_db()
    repo_path = f"/tmp/repos/{repo_id}"
    
    try:
        # 1. Clone Repo
        os.makedirs(repo_path, exist_ok=True)
        print(f"Cloning {url} into {repo_path}...")
        subprocess.run(["git", "clone", "--depth", "1", url, repo_path], check=True)
        
        # 2. Ingest Repo
        print(f"Running UniversalParser on {repo_path}...")
        ingester = RepositoryIngester(db)
        ingester.process_repository(repo_path, repo_id, repo_name)
        
        # 3. Update Status
        with db.driver.session() as session:
            session.run("MATCH (r:Repository {id: $id}) SET r.status = 'COMPLETED'", id=repo_id)
            
        # 4. Trigger Cross-Repo Linking Job
        print(f"Triggering Universal Cross-Repo Linker for project...")
        from ...ingester.cross_repo_linker import CrossRepoLinker
        linker = CrossRepoLinker(db)
        linker.link_all()
            
            
    except Exception as e:
        print(f"Ingestion failed for {repo_id}: {e}")
        with db.driver.session() as session:
            session.run("MATCH (r:Repository {id: $id}) SET r.status = 'FAILED'", id=repo_id)
            
    finally:
        # Cleanup (Disabled so Agent can read source files)
        # if os.path.exists(repo_path):
        #     shutil.rmtree(repo_path)
        pass


@router.post("", response_model=RepositoryResponse)
def add_repository(repo: RepositoryBase, background_tasks: BackgroundTasks):
    db = get_db()
    repo_id = str(uuid.uuid4())
    repo_name = repo.url.split("/")[-1].replace(".git", "")
    
    if repo.project_id:
        query = """
        CREATE (r:Repository {id: $id, url: $url, name: $name, status: 'PENDING'})
        WITH r
        MATCH (p:Project {id: $project_id})
        MERGE (p)-[:HAS_REPO]->(r)
        RETURN r
        """
        params = {"id": repo_id, "url": repo.url, "name": repo_name, "project_id": repo.project_id}
    else:
        query = """
        CREATE (r:Repository {id: $id, url: $url, name: $name, status: 'PENDING'})
        RETURN r
        """
        params = {"id": repo_id, "url": repo.url, "name": repo_name}
        
    with db.driver.session() as session:
        session.run(query, **params)
    
    # Trigger background ingestion
    background_tasks.add_task(dummy_ingest_repo, repo_id, repo.url, repo_name)
    
    return RepositoryResponse(id=repo_id, name=repo_name, url=repo.url, status="PENDING")

@router.get("", response_model=List[RepositoryResponse])
def list_repositories(project_id: str = None):
    db = get_db()
    if project_id:
        query = "MATCH (p:Project {id: $project_id})-[:HAS_REPO]->(r:Repository) RETURN r.id AS id, r.name AS name, r.url AS url, r.status AS status"
        params = {"project_id": project_id}
    else:
        query = "MATCH (r:Repository) RETURN r.id AS id, r.name AS name, r.url AS url, r.status AS status"
        params = {}
    
    with db.driver.session() as session:
        result = session.run(query, **params)
        return [RepositoryResponse(**record) for record in result]

@router.delete("/{repo_id}")
def delete_repository(repo_id: str):
    db = get_db()
    query = """
    MATCH (n {repo_id: $repo_id}) DETACH DELETE n;
    """
    query_repo = "MATCH (r:Repository {id: $repo_id}) DETACH DELETE r;"
    with db.driver.session() as session:
        session.run(query, repo_id=repo_id)
        session.run(query_repo, repo_id=repo_id)
    return {"message": "Repository deleted"}

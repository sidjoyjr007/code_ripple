from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from pydantic import BaseModel
from ...db.neo4j_client import Neo4jClient

router = APIRouter(prefix="/projects", tags=["Projects"])
db_client = None

def get_db():
    global db_client
    if not db_client:
        db_client = Neo4jClient()
    return db_client

class ProjectBase(BaseModel):
    name: str

class ProjectResponse(ProjectBase):
    id: str
    repos: int
    status: str

@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectBase):
    db = get_db()
    project_id = str(uuid.uuid4())
    
    query = """
    CREATE (p:Project {id: $id, name: $name, status: 'EMPTY'})
    RETURN p
    """
    with db.driver.session() as session:
        session.run(query, id=project_id, name=project.name)
    
    return ProjectResponse(id=project_id, name=project.name, repos=0, status="EMPTY")

@router.get("", response_model=List[ProjectResponse])
def list_projects():
    db = get_db()
    # Fetch projects and count how many repositories are linked to them
    query = """
    MATCH (p:Project)
    OPTIONAL MATCH (p)-[:HAS_REPO]->(r:Repository)
    RETURN p.id AS id, p.name AS name, p.status AS status, count(r) AS repos
    """
    
    with db.driver.session() as session:
        result = session.run(query)
        return [ProjectResponse(**record) for record in result]

@router.delete("/{project_id}")
def delete_project(project_id: str):
    db = get_db()
    # 1. Delete all associated Repositories, their AST nodes, and Vector chunks
    delete_repos_query = """
    MATCH (p:Project {id: $project_id})-[:HAS_REPO]->(r:Repository)
    MATCH (n) WHERE n.repo_id = r.id
    DETACH DELETE n
    """
    
    # 2. Delete the Project node itself
    delete_project_query = """
    MATCH (p:Project {id: $project_id})
    DETACH DELETE p
    """
    
    with db.driver.session() as session:
        # First cascade delete all repos in the project
        session.run(delete_repos_query, project_id=project_id)
        # Then delete the project
        session.run(delete_project_query, project_id=project_id)
        
    return {"message": "Project and all associated repositories deleted successfully"}

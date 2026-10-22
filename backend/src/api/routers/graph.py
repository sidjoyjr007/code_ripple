from fastapi import APIRouter
from typing import List, Dict, Any
from ..schemas import NodeResult
from ...db.neo4j_client import Neo4jClient

router = APIRouter(prefix="/repos/{repo_id}", tags=["Graph"])
db_client = None

def get_db():
    global db_client
    if not db_client:
        db_client = Neo4jClient()
    return db_client

@router.get("/graph")
def get_full_graph(repo_id: str, limit: int = 10000) -> Dict[str, Any]:
    db = get_db()
    query = """
    MATCH (source {repo_id: $repo_id})-[r]->(target {repo_id: $repo_id})
    RETURN COALESCE(source.id, source.path) AS source_id, source.name AS source_name, labels(source)[0] AS source_type,
           type(r) AS rel_type,
           COALESCE(target.id, target.path) AS target_id, target.name AS target_name, labels(target)[0] AS target_type
    LIMIT $limit
    """
    with db.driver.session() as session:
        result = session.run(query, repo_id=repo_id, limit=limit)
        nodes = {}
        links = []
        for record in result:
            src_id = record["source_id"]
            tgt_id = record["target_id"]
            
            if src_id not in nodes:
                nodes[src_id] = {"id": src_id, "name": record["source_name"], "group": record["source_type"]}
            if tgt_id not in nodes:
                nodes[tgt_id] = {"id": tgt_id, "name": record["target_name"], "group": record["target_type"]}
                
            links.append({
                "source": src_id,
                "target": tgt_id,
                "label": record["rel_type"]
            })
            
        return {
            "nodes": list(nodes.values()),
            "links": links
        }

@router.get("/symbols", response_model=List[NodeResult])
def get_symbols(repo_id: str, q: str = "", limit: int = 50):
    db = get_db()
    query = """
    MATCH (n {repo_id: $repo_id}) 
    WHERE (n:Class OR n:Function) AND toLower(n.name) CONTAINS toLower($search_term)
    RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, n.repo_id AS repo_id
    LIMIT $limit
    """
    with db.driver.session() as session:
        result = session.run(query, repo_id=repo_id, search_term=q, limit=limit)
        return [NodeResult(**record) for record in result]

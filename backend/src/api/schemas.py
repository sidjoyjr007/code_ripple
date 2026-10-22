from pydantic import BaseModel
from typing import List, Optional

class RepositoryBase(BaseModel):
    url: str
    project_id: Optional[str] = None

class RepositoryResponse(RepositoryBase):
    id: str
    name: str
    status: str

class NodeResult(BaseModel):
    id: str
    name: str
    type: str
    repo_id: str

class SymbolRelationship(BaseModel):
    source: NodeResult
    relation: str
    target: NodeResult

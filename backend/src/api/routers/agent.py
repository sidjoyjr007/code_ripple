from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ...agent.agent import invoke_agent, stream_agent
from ...agent.supervisor import stream_adlc
import os

router = APIRouter(prefix="/repos/{repo_id}/agent", tags=["Agent"])

from typing import List, Dict, Any

class ChatRequest(BaseModel):
    query: str
    session_id: str
    agent_type: str = "implication"

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
def chat_with_agent(repo_id: str, request: ChatRequest):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is missing. The Implication Agent requires this key.")
        
    try:
        response_text = invoke_agent(request.query, repo_id)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def stream_chat_with_agent(repo_id: str, request: ChatRequest):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is missing.")
        
    return StreamingResponse(
        stream_agent(request.query, repo_id, request.session_id, request.agent_type),
        media_type="text/event-stream"
    )

class ADLCRequest(BaseModel):
    requirement: str

@router.post("/adlc/stream")
async def adlc_stream_endpoint(repo_id: str, request: ADLCRequest):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is missing.")
        
    return StreamingResponse(
        stream_adlc(request.requirement, repo_id),
        media_type="text/event-stream"
    )

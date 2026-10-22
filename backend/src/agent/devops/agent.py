import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import Any
import re
from ..shared.tools import analyze_infrastructure_impact

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1, 
        streaming=True,
        google_api_key=os.environ.get("GEMINI_API_KEY", "")
    )

from ..shared.logger import get_agent_logger

logger = get_agent_logger("DevOps Agent")

async def devops_node(state: dict, config: dict = None) -> dict:
    logger.info("Checking for full infrastructure impact...")
    
    # 1. Deterministic Context Pre-Fetching
    diffs = state.get('proposed_code_diffs', [])
    diff_str = "\\n".join(diffs)
    
    # Use the architect's definitive list of affected files instead of brittle regex parsing
    modified_files = state.get("affected_files", [])
    logger.debug(f"Detected modified files: {modified_files}")
    
    # 2. Graph Query
    graph_context = "No infrastructure changes detected."
    if modified_files:
        logger.info("Querying graph for infrastructure impact...")
        graph_context = analyze_infrastructure_impact.invoke({"file_paths": modified_files})
        logger.debug(f"Graph context retrieved: {graph_context[:100]}...")
        
    # 3. Single-Shot LLM Execution
    prompt = f"""You are a Principal DevOps and Infrastructure Engineer. Review these code diffs. 
I have queried the Neo4j graph to find the full infrastructure impact of these files across all repositories.

If the graph detects database models, write Alembic/SQL migrations.
If the graph detects new environment variables, provide the `.env.example` updates.
If the graph detects new ports, provide the `Dockerfile` or `docker-compose.yml` updates.
If there is NO infrastructure impact, reply with EXACTLY 'NO_INFRASTRUCTURE_IMPACT'.

GRAPH INFRASTRUCTURE CONTEXT:
{graph_context}

DIFFS:
{diff_str}"""

    from langchain_core.callbacks.base import AsyncCallbackHandler
    import asyncio
    
    queue = config.get("configurable", {}).get("ui_queue") if config else None
    
    class StreamCallback(AsyncCallbackHandler):
        async def on_chat_model_stream(self, chunk, **kwargs):
            if chunk.content and queue:
                await queue.put({"type": "chunk", "node": "devops_agent", "content": chunk.content})
                
    res = await get_llm().ainvoke([HumanMessage(content=prompt)], config={"callbacks": [StreamCallback()]})
    content = res.content.strip()
    tokens = res.usage_metadata.get("total_tokens", 0) if hasattr(res, "usage_metadata") and res.usage_metadata else 0
    logger.info(f"LLM execution complete. Consumed {tokens} tokens.")
    
    if content == "NO_INFRASTRUCTURE_IMPACT":
        return {"messages": [res], "migration_scripts": [], "total_tokens": state.get("total_tokens", 0) + tokens}
    return {"messages": [res], "migration_scripts": [content], "total_tokens": state.get("total_tokens", 0) + tokens}

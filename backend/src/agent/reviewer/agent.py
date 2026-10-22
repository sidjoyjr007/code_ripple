import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import Any
import re
from ..shared.tools import check_contract_breach

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1, 
        streaming=True,
        google_api_key=os.environ.get("GEMINI_API_KEY", "")
    )

from ..shared.logger import get_agent_logger

logger = get_agent_logger("Reviewer Agent")

async def reviewer_node(state: dict, config: dict = None) -> dict:
    logger.info("Validating code against graph contracts...")
    
    # 1. Deterministic Context Pre-Fetching
    diffs = state.get('proposed_code_diffs', [])
    diff_str = "\\n".join(diffs)
    
    # Extract function/class names from diffs (broader regex that doesn't strictly require + symbols)
    modified_funcs = re.findall(r'(?:def|class)\\s+([a-zA-Z0-9_]+)', diff_str)
    logger.debug(f"Detected modified functions: {modified_funcs}")
    
    # 2. Graph Query
    graph_context = "No functions were modified."
    if modified_funcs:
        logger.info(f"Querying graph for contract breaches on {len(modified_funcs)} functions...")
        graph_context = check_contract_breach.invoke({"function_names": modified_funcs})
        logger.debug(f"Graph context retrieved: {graph_context[:100]}...")
        
    # 3. Single-Shot LLM Execution
    prompt = f"""You are a strict Principal Code Reviewer. Review the following architectural RFC and proposed code diffs. 
I have queried the Neo4j graph to find downstream dependencies that rely on the modified functions.
If the diff changes the signature of these functions and breaks the dependencies shown below, you must REJECT it.
If the code introduces vulnerabilities, breaks explicit architectural rules defined in the RFC, or misses critical requirements, reject it. 
Otherwise approve it.

GRAPH DEPENDENCY CONTEXT:
{graph_context}

RFC:
{state.get('architectural_rfc', '')}

DIFFS:
{diff_str}

Reply with EXACTLY 'APPROVE' or 'REJECT: [reason]'."""
    
    from langchain_core.callbacks.base import AsyncCallbackHandler
    import asyncio
    
    queue = config.get("configurable", {}).get("ui_queue") if config else None
    
    class StreamCallback(AsyncCallbackHandler):
        async def on_chat_model_stream(self, chunk, **kwargs):
            if chunk.content and queue:
                await queue.put({"type": "chunk", "node": "reviewer_agent", "content": chunk.content})
                
    res = await get_llm().ainvoke([HumanMessage(content=prompt)], config={"callbacks": [StreamCallback()]})
    content = res.content.strip()
    tokens = res.usage_metadata.get("total_tokens", 0) if hasattr(res, "usage_metadata") and res.usage_metadata else 0
    logger.info(f"LLM execution complete. Consumed {tokens} tokens.")
    
    if content.startswith("APPROVE"):
        return {"messages": [res], "reviewer_approved": True, "reviewer_feedback": "", "total_tokens": state.get("total_tokens", 0) + tokens}
    else:
        return {"messages": [res], "reviewer_approved": False, "reviewer_feedback": content, "total_tokens": state.get("total_tokens", 0) + tokens}

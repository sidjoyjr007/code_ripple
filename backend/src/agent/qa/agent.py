import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import Any
import re
from ..shared.tools import get_upstream_callers

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1, 
        streaming=True,
        google_api_key=os.environ.get("GEMINI_API_KEY", "")
    )

from ..shared.logger import get_agent_logger

logger = get_agent_logger("QA Agent")

async def qa_node(state: dict, config: dict = None) -> dict:
    logger.info("Generating integration tests...")
    
    # 1. Deterministic Context Pre-Fetching
    diffs = state.get('proposed_code_diffs', [])
    diff_str = "\\n".join(diffs)
    
    # Extract function/class names from diffs (broader regex that doesn't strictly require + symbols)
    modified_funcs = re.findall(r'(?:def|class)\\s+([a-zA-Z0-9_]+)', diff_str)
    logger.debug(f"Detected modified functions in diffs: {modified_funcs}")
    
    # 2. Graph Query
    graph_context = "No functions were modified."
    if modified_funcs:
        logger.info(f"Querying graph for upstream callers of {len(modified_funcs)} functions...")
        graph_context = get_upstream_callers.invoke({"function_names": modified_funcs})
        logger.debug(f"Graph context retrieved: {graph_context[:100]}...")
        
    # 3. Single-Shot LLM Execution
    prompt = f"""You are a QA automation engineer. Write a complete pytest file to test the following code changes.
I have queried the Neo4j graph to find the exact upstream files that call the modified functions. 
You must accurately mock these specific callers in your tests.

GRAPH CALLER CONTEXT:
{graph_context}

DIFFS:
{diff_str}"""

    from langchain_core.callbacks.base import AsyncCallbackHandler
    import asyncio
    
    queue = config.get("configurable", {}).get("ui_queue") if config else None
    
    class StreamCallback(AsyncCallbackHandler):
        async def on_chat_model_stream(self, chunk, **kwargs):
            if chunk.content and queue:
                await queue.put({"type": "chunk", "node": "qa_agent", "content": chunk.content})
                
    res = await get_llm().ainvoke([HumanMessage(content=prompt)], config={"callbacks": [StreamCallback()]})
    tokens = res.usage_metadata.get("total_tokens", 0) if hasattr(res, "usage_metadata") and res.usage_metadata else 0
    logger.info(f"LLM execution complete. Consumed {tokens} tokens.")
    return {"messages": [res], "generated_tests": [res.content], "total_tokens": state.get("total_tokens", 0) + tokens}

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1, 
        streaming=True,
        google_api_key=os.environ.get("GEMINI_API_KEY", "")
    )

from ..shared.logger import get_agent_logger

logger = get_agent_logger("Coder Agent")

async def coder_node(state: dict, config: dict = None) -> dict:
    logger.info("Generating code diffs in a single pass...")
    
    # 1. Deterministic Context Pre-Fetching
    files_context = ""
    for file_path in state.get("affected_files", []):
        clean_file_path = file_path.replace(f"/tmp/repos/{state['repo_id']}/", "").replace(f"/tmp/repos/{state['repo_id']}", "").lstrip("/")
        abs_path = os.path.join(f"/tmp/repos/{state['repo_id']}", clean_file_path)
        if os.path.exists(abs_path):
            logger.debug(f"Injecting context from: {file_path}")
            with open(abs_path, 'r', encoding='utf-8') as f:
                content = f.read()
                files_context += f"\\n--- FILE: {file_path} ---\\n{content}\\n"
    
    # 2. Single-Shot LLM Execution
    prompt = f"""You are an elite Staff Software Engineer. Implement the following RFC by writing git-style code diffs.
You MUST write diffs for the affected files provided below.

RFC:
{state.get('architectural_rfc', '')}

AFFECTED FILES SOURCE CODE:
{files_context}
"""
    if state.get("reviewer_feedback"):
        prompt += f"\\n\\nCRITICAL REVIEWER FEEDBACK TO FIX:\\n{state['reviewer_feedback']}"
        
    from langchain_core.callbacks.base import AsyncCallbackHandler
    import asyncio
    
    queue = config.get("configurable", {}).get("ui_queue") if config else None
    
    class StreamCallback(AsyncCallbackHandler):
        async def on_chat_model_stream(self, chunk, **kwargs):
            if chunk.content and queue:
                await queue.put({"type": "chunk", "node": "coder_agent", "content": chunk.content})
                
    res = await get_llm().ainvoke([HumanMessage(content=prompt)], config={"callbacks": [StreamCallback()]})
    diffs = res.content
    tokens = res.usage_metadata.get("total_tokens", 0) if hasattr(res, "usage_metadata") and res.usage_metadata else 0
    logger.info(f"LLM execution complete. Consumed {tokens} tokens.")
    return {
        "messages": [res],
        "proposed_code_diffs": [diffs],
        "reviewer_feedback": None,
        "reviewer_approved": False,
        "total_tokens": state.get("total_tokens", 0) + tokens
    }

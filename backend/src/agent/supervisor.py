from typing import Annotated, TypedDict, Optional, Sequence
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
import operator
import json
import asyncio

# 1. The Global Shared State
class ADLCState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    user_requirement: str
    repo_id: str
    graph_cache: dict
    
    
    architectural_rfc: Optional[str]
    affected_files: Optional[list]
    proposed_code_diffs: Optional[list]
    reviewer_feedback: Optional[str]
    reviewer_approved: bool
    generated_tests: Optional[list]
    migration_scripts: Optional[list]
    human_feedback: Optional[str]
    total_tokens: int

# 2. Dummy Nodes for the agents (to be implemented)

from .implication.agent import create_implication_agent
from .coder.agent import coder_node
from .reviewer.agent import reviewer_node
from .qa.agent import qa_node
from .devops.agent import devops_node
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from .shared.logger import get_agent_logger

logger = get_agent_logger("Supervisor")

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1, 
        streaming=True,
        google_api_key=os.environ.get("GEMINI_API_KEY", "")
    )

from langchain_core.runnables import RunnableConfig

async def implication_node(state: ADLCState, config: RunnableConfig):
    logger.info("Starting ADLC cycle. Planning architecture and cross-repo impact...")
    queue = config.get("configurable", {}).get("ui_queue")
    agent = create_implication_agent(in_adlc=True, queue=queue)
    res = await agent.ainvoke(
        {"messages": [HumanMessage(content=state["user_requirement"])], "repo_id": state["repo_id"]},
        config={"recursion_limit": 100}
    )
    ai_msg = res["messages"][-1]
    
    rfc = ""
    affected_files = []
    if ai_msg.tool_calls:
        for tc in ai_msg.tool_calls:
            if tc["name"] == "FinalResponse":
                rfc = tc["args"].get("markdown_report", "")
                affected_files = tc["args"].get("affected_files", [])
    
    if not rfc:
        rfc = ai_msg.content # fallback
        
    tokens = ai_msg.usage_metadata.get("total_tokens", 0) if hasattr(ai_msg, "usage_metadata") and ai_msg.usage_metadata else 0
    return {
        "architectural_rfc": rfc, 
        "affected_files": affected_files,
        "graph_cache": {"mapped": True}, 
        "total_tokens": state.get("total_tokens", 0) + tokens
    }







# 3. The Supervisor Routing Logic
def adlc_router(state: ADLCState):
    logger.info("Routing state transition...")
    if state.get("reviewer_feedback") and not state.get("reviewer_approved"):
        logger.info("Route: Coder Agent (Reviewer Rejected)")
        return "coder_agent"
        
    if not state.get("architectural_rfc"):
        logger.info("Route: Implication Agent")
        return "implication_agent"
    elif not state.get("proposed_code_diffs"):
        logger.info("Route: Coder Agent")
        return "coder_agent"
    elif not state.get("reviewer_approved"):
        logger.info("Route: Reviewer Agent")
        return "reviewer_agent"
    elif state.get("generated_tests") is None:
        logger.info("Route: QA Agent")
        return "qa_agent"
    elif state.get("migration_scripts") is None:
        logger.info("Route: DevOps Agent")
        return "devops_agent"
    else:
        logger.info("Route: END (ADLC Cycle Complete)")
        return END
# 4. Build the Graph
workflow = StateGraph(ADLCState)

workflow.add_node("implication_agent", implication_node)
workflow.add_node("coder_agent", coder_node)
workflow.add_node("reviewer_agent", reviewer_node)
workflow.add_node("qa_agent", qa_node)
workflow.add_node("devops_agent", devops_node)

workflow.set_entry_point("implication_agent")

workflow.add_conditional_edges("implication_agent", adlc_router)
workflow.add_conditional_edges("coder_agent", adlc_router)
workflow.add_conditional_edges("reviewer_agent", adlc_router)
workflow.add_conditional_edges("qa_agent", adlc_router)
workflow.add_conditional_edges("devops_agent", adlc_router)

adlc_graph = workflow.compile()

async def stream_adlc(requirement: str, repo_id: str):
    initial_state = {
        "user_requirement": requirement,
        "repo_id": repo_id,
        "graph_cache": {},
        "architectural_rfc": None,
        "proposed_code_diffs": None,
        "reviewer_feedback": None,
        "reviewer_approved": False,
        "generated_tests": None,
        "migration_scripts": None,
        "human_feedback": None,
        "total_tokens": 0
    }
    
    queue = asyncio.Queue()
    config = {"configurable": {"ui_queue": queue}}

    async def run_graph():
        try:
            async for event in adlc_graph.astream(initial_state, stream_mode="updates", config=config):
                for node, state in event.items():
                    if state is None:
                        continue
                    payload = {
                        "type": "state",
                        "node": node if node != "agent" else "implication_agent",
                        "rfc": state.get("architectural_rfc"),
                        "diffs": state.get("proposed_code_diffs"),
                        "tests": state.get("generated_tests"),
                        "migrations": state.get("migration_scripts"),
                        "tokens": state.get("total_tokens", 0)
                    }
                    await queue.put(payload)
        except Exception as e:
            logger.error(f"Graph execution error: {e}")
        finally:
            await queue.put(None)

    asyncio.create_task(run_graph())

    while True:
        item = await queue.get()
        if item is None:
            yield 'data: {"type": "state", "node": "complete"}\n\n'
            break
        yield f"data: {json.dumps(item)}\n\n"
        await asyncio.sleep(0.01)

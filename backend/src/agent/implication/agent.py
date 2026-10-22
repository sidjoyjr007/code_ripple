import os
from typing import TypedDict, Annotated, Sequence
import operator
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import (
    update_impact_dashboard, 
    analyze_full_blast_radius,
    get_file_ast_summary
)
from ..shared.tools import get_repo_schema, semantic_search, search_by_strings
from langgraph.prebuilt import ToolNode

class ImplicationState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    repo_id: str

def create_implication_agent(in_adlc: bool = False, queue = None):
    from langchain_google_genai import HarmCategory, HarmBlockThreshold
    from langchain_core.callbacks.base import AsyncCallbackHandler
    import asyncio
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.1,
        streaming=True,
        api_key=os.environ.get("GEMINI_API_KEY", "dummy_key_to_prevent_startup_crash"),
        safety_settings={
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    
    from pydantic import BaseModel, Field
    class FinalResponse(BaseModel):
        """Use this tool to deliver the final response to the user. You MUST use this tool to end the conversation."""
        thought_process: str = Field(description="Step-by-step reasoning on how you arrived at this final answer.")
        markdown_report: str = Field(description="The final comprehensive markdown report to display to the user.")
        affected_files: list[str] = Field(description="A comprehensive list of EXACT file paths across ALL repositories that need to be modified based on your RFC plan.")

    tools = [
        get_file_ast_summary, 
        get_repo_schema, 
        semantic_search,
        search_by_strings,
        analyze_full_blast_radius,
        FinalResponse
    ]
    if not in_adlc:
        tools.append(update_impact_dashboard)
        
    from .prompts import get_system_prompt
    system_prompt = get_system_prompt(in_adlc)

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    llm_with_tools = llm.bind_tools(tools)
    
    from ..shared.logger import get_agent_logger
    logger = get_agent_logger("Implication Agent")
    
    async def agent_node(state: ImplicationState):
        logger.info("Analyzing requirements and formulating plan...")
        msgs = state["messages"]
        
        # Context Pruning (Token Bloat Prevention)
        # Always keep the first message (human prompt) and the most recent interactions
        if len(msgs) > 12:
            cut_idx = len(msgs) - 8
            # Step back to ensure we don't sever a ToolMessage from its parent AIMessage
            while cut_idx > 1 and msgs[cut_idx].type != "ai":
                cut_idx -= 1
            pruned_msgs = [msgs[0]] + msgs[cut_idx:]
        else:
            pruned_msgs = msgs
            
        messages = prompt.format_messages(messages=pruned_msgs)
        
        class StreamCallback(AsyncCallbackHandler):
            async def on_chat_model_stream(self, chunk, **kwargs):
                if chunk.content and queue:
                    await queue.put({"type": "chunk", "node": "implication_agent", "content": chunk.content})
                    
        response = await llm_with_tools.ainvoke(messages, config={"callbacks": [StreamCallback()]})
        return {"messages": [response]}
        
    def should_continue(state: ImplicationState):
        messages = state["messages"]
        last_message = messages[-1]
        
        if not last_message.tool_calls:
            # If the LLM forgot to use a tool, force it to!
            logger.warning("LLM halted without using FinalResponse tool. Forcing it to.")
            return "force_final"
            
        for tool_call in last_message.tool_calls:
            if tool_call["name"] == "FinalResponse":
                logger.info("FinalResponse tool invoked. Ending implication phase.")
                return "end"
                        
        logger.debug(f"Executing tool(s): {[t['name'] for t in last_message.tool_calls]}")
        return "continue"
        
    # We only want to run standard tools in the action node, not FinalResponse
    standard_tools = [t for t in tools if getattr(t, "__name__", "") != "FinalResponse"]
    
    async def force_final_node(state: ImplicationState):
        from langchain_core.messages import HumanMessage
        return {"messages": [HumanMessage(content="You failed to call the FinalResponse tool. You MUST call FinalResponse with your report and the affected_files array.")]}
        
    workflow = StateGraph(ImplicationState)
    workflow.add_node("agent", agent_node)
    workflow.add_node("action", ToolNode(standard_tools))
    workflow.add_node("force_final", force_final_node)
    
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "continue": "action",
            "force_final": "force_final",
            "end": END
        }
    )
    workflow.add_edge("action", "agent")
    workflow.add_edge("force_final", "agent")
    
    return workflow.compile()

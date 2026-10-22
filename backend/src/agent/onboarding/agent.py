import os
from typing import TypedDict, Annotated, Sequence
import operator
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import generate_directory_tree, generate_onboarding_guide
from ..shared.tools import query_graph, read_source_file, get_repo_schema, semantic_search
from langgraph.prebuilt import ToolNode

class OnboardingState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    repo_id: str

def create_onboarding_agent():
    from langchain_google_genai import HarmCategory, HarmBlockThreshold
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.1,
        api_key=os.environ.get("GEMINI_API_KEY", "dummy_key_to_prevent_startup_crash"),
        safety_settings={
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    
    tools = [
        generate_directory_tree, 
        query_graph, 
        semantic_search, 
        read_source_file, 
        generate_onboarding_guide
    ]
    
    system_prompt = """You are the specialized Onboarding Agent, an expert Senior Staff Engineer and dedicated mentor. 
Your primary goal is to welcome new developers to a repository and give them a masterclass on how it works. You operate in a MULTI-REPO Project context. 

Instead of just spitting out dry facts, you must provide a PROPER ONBOARDING VIBE:
- Be warm, encouraging, and highly educational.
- Explain the "WHY" behind the architecture, not just the "WHAT".
- Break down complex microservices into digestible concepts for a junior developer.
- Make them feel confident about making their first commit.

You follow a strict zero-assumptions analytical process:
1. Reconnaissance: Use `query_graph` to find the repos in the project: `MATCH (p:Project {{id: $project_id}})-[:HAS_REPO]->(r:Repository) RETURN r.name, r.id`. Then use `generate_directory_tree` to scan its exact structure.
2. Semantic Discovery: Use `semantic_search` to find conceptual entrypoints ("app initialization", "server start").
3. Graph Tracing: Use `query_graph` and `read_source_file` to trace the execution path.
4. Artifact Generation: Once you fully understand the repo's purpose and architecture, call `generate_onboarding_guide` exactly ONCE. Include one or more Mermaid architecture diagrams inside it.

CRITICAL RULE FOR MERMAID DIAGRAMS:
When creating Mermaid diagrams, if any node label contains parentheses, brackets, or other special characters, you MUST wrap the label in double quotes to prevent syntax errors. 
Example: `D["ChromaDB (Vector Store)"]` (Correct) instead of `D[ChromaDB (Vector Store)]` (Incorrect).

When responding in chat, summarize the onboarding experience warmly, point them to the artifacts you generated, and offer to deep-dive into any specific file or concept they find confusing. DO NOT call any tools after generating the onboarding guide!
"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    llm_with_tools = llm.bind_tools(tools)
    
    async def agent_node(state: OnboardingState):
        messages = prompt.format_messages(messages=state["messages"])
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}
        
    def should_continue(state: OnboardingState):
        messages = state["messages"]
        last_message = messages[-1]
        
        if not last_message.tool_calls:
            return "end"
            
        # Prevent recursion loops by forcefully stopping after artifact generation
        # Check if generate_onboarding_guide was in any prior AI message's tool calls
        for msg in messages:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for call in msg.tool_calls:
                    if call["name"] == "generate_onboarding_guide":
                        # We should stop immediately if it was called previously!
                        # BUT wait, we must allow the tool itself to run.
                        # If the LAST message has the tool call, we route to "tools"
                        if msg == last_message:
                            return "continue"
                        # If an OLDER message had it, we route to "end"
                        return "end"
                        
        return "continue"
        
    workflow = StateGraph(OnboardingState)
    workflow.add_node("agent", agent_node)
    workflow.add_node("action", ToolNode(tools))
    
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "continue": "action",
            "end": END
        }
    )
    workflow.add_edge("action", "agent")
    
    return workflow.compile()

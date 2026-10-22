import os
import json
from langchain_core.messages import HumanMessage
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

def get_session_history(session_id: str):
    return RedisChatMessageHistory(session_id, url=os.environ.get("REDIS_URL", "redis://localhost:6379/0"))

def invoke_agent(user_query: str, repo_id: str, agent_type: str = "implication") -> str:
    try:
        history = get_session_history("default")
        
        if agent_type == "onboarding":
            from .onboarding.agent import create_onboarding_agent
            workflow = create_onboarding_agent()
        elif agent_type == "coder":
            from .coder.agent import create_coder_agent
            workflow = create_coder_agent()
        else:
            from .implication.agent import create_implication_agent
            workflow = create_implication_agent()

        messages = history.messages + [HumanMessage(content=f"Project ID (Multi-Repo Context): {repo_id}\\n\\nQuery: {user_query}")]
        res = workflow.invoke({"messages": messages, "repo_id": repo_id})
        output = res["messages"][-1].content
        history.add_user_message(user_query)
        history.add_ai_message(output)
        return output

    except Exception as e:
        return f"Agent Error: {str(e)}"

async def stream_agent(user_query: str, repo_id: str, session_id: str, agent_type: str = "implication"):
    history = get_session_history(session_id)
    
    try:
        if agent_type == "onboarding":
            from .onboarding.agent import create_onboarding_agent
            workflow = create_onboarding_agent()
        elif agent_type == "coder":
            from .coder.agent import create_coder_agent
            workflow = create_coder_agent()
        else:
            from .implication.agent import create_implication_agent
            workflow = create_implication_agent()

        # LangGraph expects the full list of messages
        input_messages = history.messages + [HumanMessage(content=f"Project ID (Multi-Repo Context): {repo_id}\\n\\nQuery: {user_query}")]
        
        # Save user message to history now
        history.add_user_message(user_query)
        
        full_ai_response = ""
        total_input_tokens = 0
        total_output_tokens = 0
        final_response_args_buffer = ""
        is_collecting_final_response = False
        
        print(f"\n🚀 [Agent] Starting execution for query: '{user_query}'")
        
        async for event in workflow.astream_events(
            {"messages": input_messages, "repo_id": repo_id},
            version="v2"
        ):
            kind = event["event"]
            
            if kind == "on_tool_start":
                tool_name = event.get("name", "tool")
                print(f"🛠️  [Agent] Tool started: {tool_name}")
                if tool_name == "generate_onboarding_guide":
                    yield f"data: {{ \"type\": \"onboarding_guide\", \"data\": {json.dumps(event['data'].get('input'))} }}\n\n"
                elif tool_name == "update_impact_dashboard":
                    yield f"data: {{ \"type\": \"dashboard_update\", \"data\": {json.dumps(event['data'].get('input'))} }}\n\n"
                elif tool_name == "generate_architecture_diagram":
                    yield f"data: {{ \"type\": \"architecture_diagram\", \"data\": {json.dumps(event['data'].get('input'))} }}\n\n"
                elif tool_name == "FinalResponse":
                    is_collecting_final_response = True
                else:
                    yield f"data: {{ \"type\": \"tool\", \"content\": \"Invoking {tool_name}...\" }}\n\n"
            
            elif kind == "on_tool_end":
                tool_name = event.get('name', 'tool')
                print(f"✅ [Agent] Tool finished: {tool_name}")
                
            elif kind == "on_chat_model_stream":
                chunk_obj = event["data"]["chunk"]
                if chunk_obj.content:
                    full_ai_response += chunk_obj.content
                    print(chunk_obj.content, end="", flush=True)
                    yield f"data: {{ \"type\": \"token\", \"content\": {json.dumps(chunk_obj.content)} }}\n\n"
                    
                if hasattr(chunk_obj, "tool_call_chunks") and chunk_obj.tool_call_chunks:
                    for tcc in chunk_obj.tool_call_chunks:
                        if tcc.get("name") == "FinalResponse":
                            is_collecting_final_response = True
                            
                        if is_collecting_final_response:
                            args_chunk = tcc.get("args", "")
                            if args_chunk:
                                final_response_args_buffer += args_chunk
            
            elif kind == "on_chat_model_end":
                print("\n") # formatting
                response = event["data"].get("output")
                if response and hasattr(response, "usage_metadata") and response.usage_metadata:
                    usage = response.usage_metadata
                    in_tokens = usage.get("input_tokens", 0)
                    out_tokens = usage.get("output_tokens", 0)
                    total_input_tokens += in_tokens
                    total_output_tokens += out_tokens
                    print(f"📊 [Agent] LLM Call Tokens -> In: {in_tokens} | Out: {out_tokens} | Cost: {in_tokens + out_tokens}")

                if is_collecting_final_response and final_response_args_buffer:
                    try:
                        parsed = json.loads(final_response_args_buffer)
                        thought = parsed.get("thought_process", "")
                        report = parsed.get("markdown_report", "")
                        
                        if thought:
                            print(f"\n🧠 [Agent Thought Process]: {thought}")
                        
                        full_ai_response = report
                        if report:
                            yield f"data: {{ \"type\": \"token\", \"content\": {json.dumps(report)} }}\n\n"
                        else:
                            # Fallback if markdown_report is empty but it parsed
                            yield f"data: {{ \"type\": \"token\", \"content\": {json.dumps(final_response_args_buffer)} }}\n\n"
                            
                    except Exception as e:
                        print(f"Failed to parse FinalResponse JSON: {e}")
                        # Fallback: just dump the raw unparsed string so the user sees the output!
                        yield f"data: {{ \"type\": \"token\", \"content\": {json.dumps(final_response_args_buffer)} }}\n\n"
                    
                    is_collecting_final_response = False
                    final_response_args_buffer = ""

        # Save AI response to history
        history.add_ai_message(full_ai_response)
        
        total_tokens = total_input_tokens + total_output_tokens
        print(f"==========================================")
        print(f"🏁 [Agent] Execution Complete")
        print(f"💰 [Agent] Final Token Session -> Input: {total_input_tokens} | Output: {total_output_tokens} | Total: {total_tokens}")
        print(f"==========================================\n")
        
        yield f"data: {{\"type\": \"done\"}}\n\n"
    except Exception as e:
        print(f"Agent stream error: {e}")
        yield f"data: {{ \"type\": \"error\", \"content\": {json.dumps(str(e))} }}\n\n"


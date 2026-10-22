import React, { useState, useRef, useEffect } from 'react';
import { BrutalCard } from '../BrutalCard';
import { BrutalTextarea } from '../BrutalTextarea';
import { BrutalButton } from '../BrutalButton';
import { Send, Bot, Activity, BarChart } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { BrutalSelect } from '../BrutalSelect';
export const AgentChatPanel = ({ projects, activeProjectId, setActiveProjectId, activeAgent, setActiveAgent }) => {
  const [messages, setMessages] = useState([]);
  const [tokens, setTokens] = useState({ input: 0, output: 0 });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (activeAgent === 'onboarding') {
      setMessages([
        { role: 'agent', content: "Hello! I am the **Onboarding Agent**. I am here to help you understand this project. Ask me to explain the architecture or how a specific microservice works, and I will generate an interactive directory tree, architecture diagrams, and a comprehensive onboarding guide." }
      ]);
    } else if (activeAgent === 'coder') {
      setMessages([
        { role: 'agent', content: "Hello! I am the **Coder Agent**. Give me a feature request or an architectural RFC, and I will use the Semantic Knowledge Graph to navigate the codebase and generate exact markdown diffs for you." }
      ]);
    } else {
      setMessages([
        { role: 'agent', content: "Hello! I am the **Implication Agent**. Ask me about the blast radius of any code change you want to make, and I will query the Semantic Knowledge Graph to find hard dependencies." }
      ]);
    }
  }, [activeAgent]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    setTokens(prev => ({ ...prev, input: prev.input + Math.ceil(input.length / 4) }));
    
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/repos/${activeProjectId}/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ 
          query: userMessage.content,
          session_id: sessionId,
          agent_type: activeAgent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialData = "";

      // Add a placeholder message for the agent
      setMessages(prev => [...prev, { role: 'agent', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        partialData += decoder.decode(value, { stream: true });
        
        // SSE messages are separated by \n\n
        const chunks = partialData.split('\n\n');
        partialData = chunks.pop(); // Keep the last incomplete chunk

        for (const chunk of chunks) {
          if (chunk.startsWith('data: ')) {
            const dataStr = chunk.replace('data: ', '');
            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === 'tool') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  if (!last.tools) last.tools = [];
                  last.tools.push(data.content);
                  last.content = ''; // Clear intermediate streaming thoughts when a tool executes!
                  return newMsgs;
                });
              } else if (data.type === 'dashboard_update') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  last.dashboardData = data.data;
                  return newMsgs;
                });
              } else if (data.type === 'architecture_diagram') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  last.architectureDiagram = data.data.mermaidCode || data.data.mermaid_code;
                  return newMsgs;
                });
              } else if (data.type === 'onboarding_guide') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  last.onboardingGuide = data.data;
                  return newMsgs;
                });
              } else if (data.type === 'token') {
                setTokens(prev => ({ ...prev, output: prev.output + Math.ceil(data.content.length / 4) }));
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = { ...newMsgs[newMsgs.length - 1] };
                  last.content = (last.content || '') + data.content;
                  newMsgs[newMsgs.length - 1] = last;
                  return newMsgs;
                });
              } else if (data.type === 'final') {
                // Ignore final if we are streaming tokens successfully,
                // but just in case, we can use it if nothing streamed.
              } else if (data.type === 'error') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  last.content += `\n\n**Error:** ${data.content}`;
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", dataStr, e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        // If the last message was empty, replace it, otherwise append.
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last && last.role === 'agent' && !last.content) {
          last.content = `**Connection Error:** ${error.message}. Is the backend running?`;
        } else {
          newMsgs.push({ role: 'agent', content: `**Error:** ${error.message}` });
        }
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-white">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-background flex flex-col py-6">
        {messages.map((msg, idx) => (
          <MessageBubble 
            key={idx} 
            message={msg} 
            agentName={activeAgent === 'onboarding' ? 'Onboarding Agent' : activeAgent === 'coder' ? 'Coder Agent' : 'Implication Agent'}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start px-4">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center animate-pulse mr-4">
              <Activity size={16} className="text-primary-foreground" />
            </div>
            <div className="flex items-center">
              <span className="font-bold animate-pulse text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Floating Brutalist Chat Input (ChatGPT/Claude Layout) */}
      <div className="bg-background px-4 pb-6 pt-2 flex justify-center w-full">
        <div className="relative flex flex-col bg-white border-[3px] border-black shadow-brutal-sm focus-within:shadow-brutal focus-within:translate-y-[-2px] transition-all w-full max-w-4xl p-3 gap-2 rounded-md">
          
          {/* Text Area */}
          <textarea 
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={activeAgent === 'onboarding' ? "Ask me to explain the frontend repository..." : activeAgent === 'coder' ? "Paste an architectural RFC to generate code diffs..." : "Ask about architectural blast radius..."}
            className="w-full min-h-[44px] max-h-[200px] overflow-y-auto bg-transparent outline-none border-none ring-0 focus:ring-0 resize-none font-bold text-sm placeholder-black/40 px-2 pt-2"
            style={{ boxShadow: 'none' }}
          />

          {/* Bottom Bar */}
          <div className="flex justify-between items-end px-2 pt-1">
            
            {/* Left Actions & Selectors Group */}
            <div className="flex items-center gap-4">
              
              {/* Context Selector */}
              <div className="flex items-center gap-1.5">
                <div className="w-[140px]">
                  <BrutalSelect
                    size="sm"
                    value={activeProjectId}
                    onChange={setActiveProjectId}
                    options={projects?.map(p => ({ value: p.id, label: p.name }))}
                    className="w-full"
                    triggerClassName="!border-none !shadow-none !bg-transparent !p-0 !min-h-0 !h-auto hover:!bg-transparent hover:opacity-70 !translate-x-0 !translate-y-0 active:!translate-x-0 active:!translate-y-0"
                  />
                </div>
              </div>

              {/* Agent Selector */}
              <div className="flex items-center gap-1.5">
                <div className="w-[160px]">
                  <BrutalSelect
                    size="sm"
                    value={activeAgent}
                    onChange={setActiveAgent}
                    options={[
                      { value: 'implication', label: 'Implication Agent' },
                      { value: 'coder', label: 'Coder Agent' },
                      { value: 'onboarding', label: 'Onboarding Agent' }
                    ]}
                    className="w-full"
                    triggerClassName="!border-none !shadow-none !bg-transparent !p-0 !min-h-0 !h-auto hover:!bg-transparent hover:opacity-70 !translate-x-0 !translate-y-0 active:!translate-x-0 active:!translate-y-0"
                  />
                </div>
              </div>
              
              {/* Token Counter */}
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l-2 border-black/20 text-[10px] font-black uppercase text-black/60">
                <span>In: {tokens.input}</span>
                <span>•</span>
                <span>Out: {tokens.output}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-black text-black/30 uppercase tracking-widest hidden sm:block">
                {isLoading ? 'THINKING...' : 'SHIFT + ENTER'}
              </div>
              <button 
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="bg-primary text-primary-foreground border-[3px] border-black font-black uppercase px-6 py-2 shadow-sm hover:translate-y-[-2px] hover:shadow-brutal active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 rounded-md"
              >
                <span className="text-xs tracking-wider">Send</span>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

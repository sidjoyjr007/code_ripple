import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Activity, CheckCircle, FileText, Code, FlaskConical, Database, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { BrutalCard } from '../components/BrutalCard';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput } from '../components/BrutalInput';
import { BrutalTabs } from '../components/BrutalTabs';
import { PageHeader } from '../components/PageHeader';

export default function ADLCView() {
  const { id: repoId } = useParams();
  const navigate = useNavigate();
  
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  
  // Dummy State for UI testing
  const [adlcState, setAdlcState] = useState({
    requirement: "",
    status: "idle", // idle, planning, coding, reviewing, testing, devops, complete
    rfc: "",
    diffs: "",
    tests: "",
    migrations: "",
    tokens: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;
    
    setIsRunning(true);
    setAdlcState({ ...adlcState, requirement: input, status: "planning", rfc: "", diffs: "", tests: "", migrations: "", tokens: 0 });
    const currentInput = input;
    setInput('');
    
    try {
      const response = await fetch(`http://localhost:8000/api/repos/${repoId || 'default'}/agent/adlc/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ requirement: currentInput })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialData = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        partialData += decoder.decode(value, { stream: true });
        const chunks = partialData.split('\\n\\n');
        partialData = chunks.pop();

        for (const chunk of chunks) {
          if (chunk.startsWith('data: ')) {
            const dataStr = chunk.replace('data: ', '');
            try {
              const data = JSON.parse(dataStr);
              setAdlcState(prev => {
                const newState = { ...prev };
                
                if (data.type === "chunk") {
                  // Token-by-token streaming
                  if (data.node === "implication_agent") {
                    newState.status = "planning";
                    newState.rfc = (newState.rfc || "") + data.content;
                  } else if (data.node === "coder_agent") {
                    newState.status = "coding";
                    newState.diffs = (newState.diffs || "") + data.content;
                  } else if (data.node === "reviewer_agent") {
                    newState.status = "reviewing";
                  } else if (data.node === "qa_agent") {
                    newState.status = "testing";
                    newState.tests = (newState.tests || "") + data.content;
                  } else if (data.node === "devops_agent") {
                    newState.status = "devops";
                    newState.migrations = (newState.migrations || "") + data.content;
                  }
                } else if (data.type === "state") {
                  // Node completion state sync
                  if (data.node === "implication_agent") {
                    newState.status = "coding";
                    newState.rfc = data.rfc || prev.rfc;
                  } else if (data.node === "coder_agent") {
                    newState.status = "reviewing";
                    newState.diffs = (data.diffs && data.diffs[0]) ? data.diffs[0] : prev.diffs;
                  } else if (data.node === "reviewer_agent") {
                    newState.status = "testing";
                  } else if (data.node === "qa_agent") {
                    newState.status = "devops";
                    newState.tests = (data.tests && data.tests[0]) ? data.tests[0] : prev.tests;
                  } else if (data.node === "devops_agent") {
                    newState.status = "complete";
                    newState.migrations = (data.migrations && data.migrations[0]) ? data.migrations[0] : prev.migrations;
                  } else if (data.node === "complete") {
                    newState.status = "complete";
                    setIsRunning(false);
                  }
                  if (data.tokens) {
                    newState.tokens = data.tokens;
                  }
                }
                return newState;
              });
            } catch (err) {
              console.error("Error parsing SSE JSON", err);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  const renderTabContent = (content, emptyText) => {
    if (content) {
      return (
        <div className="prose prose-sm max-w-none prose-headings:font-black prose-pre:border-[3px] prose-pre:border-black prose-pre:rounded-none prose-pre:shadow-brutal-sm h-full overflow-y-auto pr-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center opacity-50 flex-col gap-4">
        <Activity size={48} className={isRunning ? "animate-spin" : ""} />
        <span className="font-bold uppercase tracking-widest text-sm">
          {isRunning ? "Generating Artifacts..." : emptyText}
        </span>
      </div>
    );
  };

  const tabs = [
    { 
      value: 'rfc', 
      label: <span className="flex items-center gap-2"><FileText size={16}/> RFC</span>, 
      content: renderTabContent(adlcState.rfc, "No RFC Yet") 
    },
    { 
      value: 'diffs', 
      label: <span className="flex items-center gap-2"><Code size={16}/> Diffs</span>, 
      content: renderTabContent(adlcState.diffs, "No Code Diffs Yet") 
    },
    { 
      value: 'tests', 
      label: <span className="flex items-center gap-2"><FlaskConical size={16}/> Tests</span>, 
      content: renderTabContent(adlcState.tests, "No Tests Yet") 
    },
    { 
      value: 'migrations', 
      label: <span className="flex items-center gap-2"><Database size={16}/> Migrations</span>, 
      content: renderTabContent(adlcState.migrations, "No Migrations Yet") 
    },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden p-6 gap-6">
      
      <PageHeader
        title="ADLC Supervisor"
        description="Multi-Agent Control Center"
        icon={Cpu}
      />

      <div className="flex flex-1 min-h-0 gap-6 max-w-7xl mx-auto w-full">
        {/* LEFT PANE: Control Room */}
        <BrutalCard className="w-1/3 flex flex-col p-0 overflow-hidden shadow-brutal-lg">
          {/* Pipeline Status */}
          <div className="flex-1 p-6 overflow-y-auto bg-surface">
            {adlcState.requirement ? (
              <div className="space-y-6">
                <div className="bg-primary/20 p-4 border-[3px] border-border shadow-brutal-sm rounded-md">
                  <span className="text-xs font-black uppercase text-foreground/50 block mb-1">Requirement:</span>
                  <span className="font-bold text-sm text-foreground">{adlcState.requirement}</span>
                </div>
                
                <div className="space-y-4 font-bold text-sm">
                  <StatusItem label="1. Implication Agent" active={adlcState.status === "planning"} complete={["coding", "reviewing", "testing", "devops", "complete"].includes(adlcState.status)} />
                  <StatusItem label="2. Coder Agent" active={adlcState.status === "coding"} complete={["reviewing", "testing", "devops", "complete"].includes(adlcState.status)} />
                  <StatusItem label="3. Reviewer Agent" active={adlcState.status === "reviewing"} complete={["testing", "devops", "complete"].includes(adlcState.status)} />
                  <StatusItem label="4. QA Agent" active={adlcState.status === "testing"} complete={["devops", "complete"].includes(adlcState.status)} />
                  <StatusItem label="5. DevOps Agent" active={adlcState.status === "devops"} complete={adlcState.status === "complete"} />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center opacity-50 p-8">
                <span className="font-bold">Enter a feature requirement below to launch the multi-agent swarm.</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t-[3px] border-border bg-muted">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <BrutalInput
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isRunning}
                placeholder={adlcState.status === 'complete' ? "Tweak the code..." : "E.g., Replace Chroma..."}
                className="flex-1 min-w-0"
              />
              <BrutalButton 
                type="submit" 
                disabled={isRunning || !input.trim()}
                className="px-4 shrink-0"
              >
                <Send size={20} />
              </BrutalButton>
            </form>
            <div className="mt-4 text-xs font-mono text-muted-foreground flex justify-between">
              <span>Status: {adlcState.status.toUpperCase()}</span>
              {adlcState.tokens > 0 && <span className="text-secondary font-bold">Total Tokens Consumed: {adlcState.tokens.toLocaleString()}</span>}
            </div>
          </div>
        </BrutalCard>

        {/* RIGHT PANE: Artifact Viewer */}
        <div className="w-2/3 flex flex-col min-h-0">
          <BrutalTabs tabs={tabs} defaultValue="rfc" className="h-full flex-1 min-h-0" contentClassName="overflow-hidden p-6" />
          
          {adlcState.status === "complete" && (
            <BrutalCard className="mt-6 p-4 flex justify-end gap-4 animate-in slide-in-from-bottom-5">
              <BrutalButton 
                onClick={() => setAdlcState({ requirement: "", status: "idle", rfc: "", diffs: "", tests: "", migrations: "" })}
                className="bg-primary text-primary-foreground gap-2 w-full"
              >
                <CheckCircle size={18} />
                ADLC Cycle Complete - Start New Cycle
              </BrutalButton>
            </BrutalCard>
          )}
        </div>
      </div>
    </div>
  );
}

const StatusItem = ({ label, active, complete }) => (
  <div className={`flex items-center gap-3 p-3 border-[3px] border-transparent transition-all rounded-md ${active ? 'bg-primary/10 border-border shadow-brutal-sm translate-x-2' : ''} ${complete ? 'opacity-50' : ''}`}>
    {complete ? (
      <CheckCircle size={18} className="text-foreground" />
    ) : active ? (
      <Activity size={18} className="animate-spin text-foreground" />
    ) : (
      <div className="w-[18px] h-[18px] border-[3px] border-foreground/30 rounded-full" />
    )}
    <span className={active ? 'text-foreground font-black' : 'text-foreground/70'}>{label}</span>
  </div>
);

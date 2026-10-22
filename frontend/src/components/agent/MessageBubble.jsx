import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { User, Activity, Settings, BarChart, ChevronDown, ChevronUp, Search, Link2, Zap, Wrench, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ImpactReportArtifact } from './ImpactReportArtifact';
import { OnboardingGuideArtifact } from './OnboardingGuideArtifact';
import { ArchitectureDiagramArtifact } from './ArchitectureDiagramArtifact';

export const MessageBubble = ({ message, agentName = "Ripple Agent" }) => {
  const isUser = message.role === 'user';
  const uniqueTools = message.tools ? Array.from(new Set(message.tools)) : [];
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);
  
  const handleDownload = () => {
    if (!message.content) return;
    const blob = new Blob([message.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("w-full flex px-4 py-6", isUser ? "bg-accent/10" : "")}>
      <div className="w-8 h-8 rounded-sm shrink-0 mr-4 flex items-center justify-center border-2 border-black" 
           style={{ backgroundColor: isUser ? '#000' : 'hsl(var(--primary))' }}>
        {isUser ? <User size={16} className="text-white" /> : <Activity size={16} className="text-primary-foreground" />}
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Name */}
        <div className="font-black text-xs uppercase tracking-wider mb-2 opacity-80">
          {isUser ? 'You' : agentName}
        </div>

        {/* Tool Executions */}
        {!isUser && uniqueTools.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {uniqueTools.map((tool, idx) => {
              const cleanToolName = tool.replace('Invoking ', '').replace('...', '');
              
              // Determine tool symbol
              let ToolIcon = Settings;
              if (cleanToolName.includes('search')) ToolIcon = Search;
              else if (cleanToolName.includes('dependencies') || cleanToolName.includes('contracts')) ToolIcon = Link2;
              else if (cleanToolName.includes('blast_radius')) ToolIcon = Zap;
              else ToolIcon = Wrench;

              return (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-bold bg-white text-black border-2 border-black rounded-md px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <ToolIcon size={12} className={ToolIcon === Settings ? "animate-spin" : ""} />
                  <span>{cleanToolName}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div className="prose prose-sm max-w-none dark:prose-invert font-medium leading-relaxed break-words text-foreground">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="font-black text-xl mb-3 mt-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="font-black text-lg mb-2 mt-4" {...props} />,
                  h3: ({node, ...props}) => <h3 className="font-bold text-md mb-2 mt-3" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  code({node, inline, className, children, ...props}) {
                    return (
                      <code className={cn("bg-black/10 px-1.5 py-0.5 rounded-sm font-semibold", className)} {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre({node, children, ...props}) {
                    return (
                      <pre className="bg-black text-white p-4 rounded-md overflow-x-auto mb-4 text-[13px]" {...props}>
                        {children}
                      </pre>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            {(!isUser && message.content && (message.content.includes('Executive Summary') || message.content.includes('RFC'))) && (
              <div className="mt-4 flex justify-start">
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all bg-white text-black"
                >
                  <Download size={14} /> Download Markdown Report
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Interactive Dashboards/Artifacts */}
        {message.dashboardData && (
          <div className="mt-4 border-[3px] border-black shadow-brutal-sm bg-white overflow-hidden max-w-full flex flex-col rounded-md">
            <button 
              onClick={() => setIsArtifactExpanded(!isArtifactExpanded)}
              className="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface/80 transition-colors border-b-[3px] border-transparent"
              style={{ borderBottomColor: isArtifactExpanded ? '#000' : 'transparent' }}
            >
              <div className="flex items-center gap-2">
                <BarChart size={16} />
                <span className="font-black text-sm uppercase tracking-widest">Impact Report Dashboard Generated</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                {isArtifactExpanded ? (
                  <><ChevronUp size={16} /> Collapse</>
                ) : (
                  <><ChevronDown size={16} /> Expand</>
                )}
              </div>
            </button>
            {isArtifactExpanded && (
                <ImpactReportArtifact dashboardData={message.dashboardData} />
            )}
          </div>
        )}

        {/* Onboarding Guide Artifact */}
        {message.onboardingGuide && (
          <OnboardingGuideArtifact data={message.onboardingGuide} />
        )}

        {/* Architecture Diagram Artifact */}
        {message.architectureDiagram && (
          <ArchitectureDiagramArtifact mermaidCode={message.architectureDiagram} />
        )}

      </div>
    </div>
  );
};

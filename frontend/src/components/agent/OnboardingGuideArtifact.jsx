import React, { useState } from 'react';
import { BrutalCard } from '../BrutalCard';
import { Bot, ChevronDown, ChevronUp, CheckSquare, Terminal, Activity } from 'lucide-react';
import { ArchitectureDiagramArtifact } from './ArchitectureDiagramArtifact';

export const OnboardingGuideArtifact = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!data) return null;

  return (
    <div className="mt-4 border-[3px] border-black shadow-brutal-sm bg-white overflow-hidden max-w-full flex flex-col rounded-md">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-b-[3px] border-transparent"
        style={{ borderBottomColor: isExpanded ? '#000' : 'transparent' }}
      >
        <div className="flex items-center gap-2">
          <Bot size={16} />
          <span className="font-black text-sm uppercase tracking-widest">Onboarding Guide Generated</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold opacity-80">
          {isExpanded ? (
            <><ChevronUp size={16} /> Collapse</>
          ) : (
            <><ChevronDown size={16} /> Expand</>
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="w-full flex flex-col p-6 gap-6 bg-surface">
          {/* Header Summary */}
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-2xl uppercase">{data.repo_purpose || 'Repository Overview'}</h3>
            <div className="flex items-center gap-4 mt-2">
              <span className="px-3 py-1 bg-black text-white font-bold text-xs uppercase tracking-wider shadow-brutal-sm border-[2px] border-black rounded-md">
                {data.primary_language || 'Unknown Language'}
              </span>
            </div>
          </div>

          {/* Key Dependencies */}
          {data.key_dependencies && data.key_dependencies.length > 0 && (
            <BrutalCard className="border-[3px] bg-card p-4 shadow-brutal-sm rounded-md">
              <h4 className="font-black text-sm uppercase tracking-widest mb-3 border-b-[2px] border-black pb-2">Key Dependencies</h4>
              <div className="flex flex-wrap gap-2">
                {data.key_dependencies.map((dep, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white border-[2px] border-black text-xs font-bold">
                    {dep}
                  </span>
                ))}
              </div>
            </BrutalCard>
          )}

          {/* Architecture Patterns */}
          {data.architecture_patterns && data.architecture_patterns.length > 0 && (
            <BrutalCard className="border-[3px] bg-secondary p-4 shadow-brutal-sm rounded-md">
              <h4 className="font-black text-sm uppercase tracking-widest mb-3 border-b-[2px] border-black pb-2 text-secondary-foreground">Architecture & Design Patterns</h4>
              <ul className="list-disc pl-5 space-y-1">
                {data.architecture_patterns.map((pattern, idx) => (
                  <li key={idx} className="text-sm font-bold text-secondary-foreground">{pattern}</li>
                ))}
              </ul>
            </BrutalCard>
          )}

          {/* Architecture Diagrams */}
          {data.architecture_diagrams && data.architecture_diagrams.length > 0 && (
            <div className="flex flex-col gap-6 w-full">
              {data.architecture_diagrams.map((mermaidCode, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <h4 className="font-black text-sm uppercase tracking-widest border-b-[2px] border-black pb-2 flex items-center gap-2">
                    <Activity size={16} /> Topology Overview {data.architecture_diagrams.length > 1 ? idx + 1 : ''}
                  </h4>
                  <ArchitectureDiagramArtifact mermaidCode={mermaidCode} />
                </div>
              ))}
            </div>
          )}

          {/* Core Files to Read */}
          {data.core_files_to_read && data.core_files_to_read.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="font-black text-sm uppercase tracking-widest border-b-[2px] border-black pb-2 flex items-center gap-2">
                <Terminal size={16} /> Core Files You Must Read
              </h4>
              <div className="flex flex-col gap-3">
                {data.core_files_to_read.map((file, idx) => (
                  <div key={idx} className="flex flex-col bg-white border-[3px] border-black p-3">
                    <code className="bg-black/10 p-1 px-2 font-bold text-xs mb-2 w-fit">{file.filepath}</code>
                    <p className="text-sm font-medium">{file.importance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Setup Steps */}
          {data.setup_steps && data.setup_steps.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="font-black text-sm uppercase tracking-widest border-b-[2px] border-black pb-2 flex items-center gap-2">
                <CheckSquare size={16} /> Setup Instructions
              </h4>
              <div className="flex flex-col gap-4">
                {data.setup_steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col bg-white border-[3px] border-black shadow-brutal-sm p-4 relative pl-12 rounded-md">
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-black text-white flex items-start justify-center pt-4 font-black text-lg">
                      {idx + 1}
                    </div>
                    <h5 className="font-black text-md uppercase tracking-wider mb-2">{step.title}</h5>
                    <p className="text-sm font-medium leading-relaxed opacity-80 mb-3">{step.description}</p>
                    
                    {step.command && (
                      <div className="bg-black text-white p-3 font-mono text-xs flex items-center gap-3">
                        <Terminal size={14} className="opacity-50 shrink-0" />
                        <code>{step.command}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Gotchas */}
          {data.common_gotchas && data.common_gotchas.length > 0 && (
            <BrutalCard className="border-[3px] bg-destructive p-4 shadow-brutal-sm rounded-md">
              <h4 className="font-black text-sm uppercase tracking-widest mb-3 border-b-[2px] border-black pb-2 text-destructive-foreground">⚠️ Common Gotchas & Pitfalls</h4>
              <ul className="list-disc pl-5 space-y-1">
                {data.common_gotchas.map((gotcha, idx) => (
                  <li key={idx} className="text-sm font-bold text-destructive-foreground">{gotcha}</li>
                ))}
              </ul>
            </BrutalCard>
          )}
        </div>
      )}
    </div>
  );
};

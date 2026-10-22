import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({ 
  startOnLoad: false, 
  theme: 'base',
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#000000',
    primaryBorderColor: '#000000',
    lineColor: '#000000',
    secondaryColor: '#f4f4f4',
    tertiaryColor: '#e5e5e5'
  }
});

export const ArchitectureDiagramArtifact = ({ mermaidCode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const containerRef = useRef(null);
  
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isExpanded && mermaidCode && containerRef.current) {
      
      // Strip markdown code blocks if the LLM hallucinated them inside the tool argument
      let cleanCode = mermaidCode.trim();
      if (cleanCode.startsWith('```mermaid')) {
        cleanCode = cleanCode.replace(/^```mermaid\n?/, '');
      }
      if (cleanCode.endsWith('```')) {
        cleanCode = cleanCode.replace(/```$/, '');
      }
      
      // Strip out the word "mermaid" if the LLM just wrote it as text before the graph
      cleanCode = cleanCode.replace(/^mermaid\s+/i, '');
      cleanCode = cleanCode.trim();
      
      // Force valid declaration if missing
      if (!cleanCode.match(/^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|pie|journey)/)) {
        cleanCode = 'graph TD\n' + cleanCode;
      }

      // Sanitize subgraph declarations to be absolutely bulletproof
      cleanCode = cleanCode.replace(/^[ \t]*subgraph\s+(.*?)$/gm, (match, p1) => {
        let content = p1.trim();
        
        // Case 1: Already using bracket syntax e.g., id [Title] or id["Title"]
        let bracketMatch = content.match(/^(\S+)\s*\[(.*?)\]$/);
        if (bracketMatch) {
          let id = "sg_" + bracketMatch[1].replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          let title = bracketMatch[2].replace(/^"|"$/g, ''); // Strip quotes to prevent nested quotes
          return `    subgraph ${id} ["${title}"]`;
        }
        
        // Case 2: Simple ID with no spaces
        if (content.match(/^\S+$/)) {
          let id = "sg_" + content.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          return `    subgraph ${id}`;
        }
        
        // Case 3: Spaces/Parens but no brackets e.g., subgraph Frontend (cr-frontend)
        let sg_id = "sg_" + content.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        let title = content.replace(/^"|"$/g, '');
        return `    subgraph ${sg_id} ["${title}"]`;
      });

      // 1. Sanitize nested quotes inside already-quoted labels: id["..."] -> id['...']
      cleanCode = cleanCode.replace(/([A-Za-z0-9_\-]+)\s*\["(.*?)"\]/g, (match, id, innerText) => {
        return `${id}["${innerText.replace(/"/g, "'")}"]`;
      });
      cleanCode = cleanCode.replace(/([A-Za-z0-9_\-]+)\s*\("(.*?)"\)/g, (match, id, innerText) => {
        return `${id}("${innerText.replace(/"/g, "'")}")`;
      });

      // 2. Automatically quote node labels that contain spaces, slashes, or parentheses but aren't quoted
      // We use ([^\]]+) to catch unquoted strings that might contain rogue quotes
      cleanCode = cleanCode.replace(/([A-Za-z0-9_\-]+)\s*\[([^\]]+)\]/g, (match, id, text) => {
        if (text.startsWith('"') && text.endsWith('"')) return match; // Already perfectly quoted
        
        let safeText = text.replace(/"/g, "'");
        if (safeText.match(/[\(\)\/\s,]/)) {
          return `${id}["${safeText}"]`;
        }
        return match;
      });
      
      cleanCode = cleanCode.replace(/([A-Za-z0-9_\-]+)\s*\(([^)]+)\)/g, (match, id, text) => {
        if (text.startsWith('"') && text.endsWith('"')) return match; // Already perfectly quoted
        
        let safeText = text.replace(/"/g, "'");
        if (safeText.match(/[\/\s,\[\]]/)) {
          return `${id}("${safeText}")`;
        }
        return match;
      });
      
      const renderDiagram = async () => {
        try {
          containerRef.current.innerHTML = '';
          const { svg } = await mermaid.render(diagramId, cleanCode);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (err) {
          console.error("Mermaid error:", err);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="p-4 bg-destructive text-destructive-foreground font-mono text-xs">Error rendering diagram: ${err.message}</div><pre class="mt-2 text-xs font-mono p-4 bg-black text-white overflow-x-auto">${cleanCode}</pre>`;
          }
        }
      };
      
      renderDiagram();
    }
  }, [mermaidCode, isExpanded, diagramId]);

  if (!mermaidCode) return null;

  return (
    <div className="mt-4 border-[3px] border-black shadow-brutal-sm bg-white overflow-hidden max-w-full flex flex-col rounded-md">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors border-b-[3px] border-transparent"
        style={{ borderBottomColor: isExpanded ? '#000' : 'transparent' }}
      >
        <div className="flex items-center gap-2">
          <Activity size={16} />
          <span className="font-black text-sm uppercase tracking-widest">Architecture Diagram Generated</span>
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
        <div className="w-full p-6 bg-surface overflow-x-auto flex flex-col items-center">
          <div className="font-mono text-sm opacity-50 mb-4 font-bold self-start border-b-2 border-black/20 pb-2 w-full">
            // Architecture Topology
          </div>
          <div 
            ref={containerRef} 
            className="w-full flex justify-center py-6 min-h-[200px]"
          >
            {/* SVG rendered here */}
            <div className="animate-pulse text-sm font-bold opacity-50">Rendering diagram...</div>
          </div>
        </div>
      )}
    </div>
  );
};

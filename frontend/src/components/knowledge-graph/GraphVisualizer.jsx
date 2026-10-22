import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const NODE_COLORS = {
  Repository: '#ef4444', // Red
  Directory: '#f59e0b', // Amber
  File: '#10b981', // Emerald
  Class: '#3b82f6', // Blue
  Function: '#8b5cf6', // Violet
  Unknown: '#64748b' // Slate
};

export function GraphVisualizer({ graphData, onNodeClick }) {
  const graphRef = useRef();
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Auto-fit graph on load
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 50);
      }, 50);
    }
  }, [graphData]);

  const handleZoomIn = () => {
    const currentZoom = graphRef.current.zoom();
    graphRef.current.zoom(currentZoom * 1.5, 400);
  };

  const handleZoomOut = () => {
    const currentZoom = graphRef.current.zoom();
    graphRef.current.zoom(currentZoom / 1.5, 400);
  };

  const handleResetZoom = () => {
    graphRef.current.zoomToFit(400, 50);
  };

  // Compute visible graph based on expansion state
  const visibleGraph = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodes: [], links: [] };

    const incomingLinks = new Map();
    graphData.links.forEach(l => {
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      incomingLinks.set(targetId, (incomingLinks.get(targetId) || 0) + 1);
    });

    const roots = graphData.nodes.filter(n => !incomingLinks.get(n.id) || n.group === 'Repository' || n.group === 'Directory');
    const visibleNodeIds = new Set(roots.map(n => n.id));
    
    const addChildren = (parentId) => {
      graphData.links.forEach(l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        if (srcId === parentId) {
          visibleNodeIds.add(tgtId);
          if (expandedNodes.has(tgtId)) {
            addChildren(tgtId);
          }
        }
      });
    };

    expandedNodes.forEach(addChildren);

    if (visibleNodeIds.size === 0) {
      graphData.nodes.forEach(n => visibleNodeIds.add(n.id));
    }

    const nodes = graphData.nodes.filter(n => visibleNodeIds.has(n.id));
    const links = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return visibleNodeIds.has(srcId) && visibleNodeIds.has(tgtId);
    });

    return { nodes, links };
  }, [graphData, expandedNodes]);

  const handleNodeClick = useCallback((node) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });

    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-surface relative">
        <p className="font-bold text-lg uppercase tracking-widest opacity-50">No graph data</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-surface relative" style={{ minHeight: '600px' }}>
      
      {/* Zoom Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button onClick={handleZoomIn} className="bg-white border-[3px] border-black p-2 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-md" title="Zoom In">
          <ZoomIn size={24} strokeWidth={3} />
        </button>
        <button onClick={handleZoomOut} className="bg-white border-[3px] border-black p-2 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-md" title="Zoom Out">
          <ZoomOut size={24} strokeWidth={3} />
        </button>
        <button onClick={handleResetZoom} className="bg-white border-[3px] border-black p-2 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-md" title="Reset Zoom">
          <Maximize size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white border-[3px] border-black p-3 shadow-brutal-sm rounded-md">
        <h3 className="font-black uppercase text-xs mb-2 tracking-widest border-b-[3px] border-black pb-1">Legend</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(NODE_COLORS).filter(([key]) => key !== 'Unknown').map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black rounded-full" style={{ backgroundColor: color }}></div>
              <span className="font-bold text-xs uppercase">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={visibleGraph}
        nodeRelSize={6}
        nodeColor={node => NODE_COLORS[node.group] || NODE_COLORS.Unknown}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const getNodeColor = (n) => NODE_COLORS[n.group] || NODE_COLORS.Unknown;

          let label = node.name;
          if (!label && node.id && typeof node.id === 'string') {
            const parts = node.id.split('/');
            label = parts[parts.length - 1];
          }
          label = label || "Unknown";

          const fontSize = 12 / globalScale;
          const r = 8;

          // Draw Circular Node
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2 / globalScale;
          ctx.stroke();

          // Draw Label Below Node
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y + r + (2 / globalScale), bckgDimensions[0], bckgDimensions[1], 2 / globalScale);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1 / globalScale;
          ctx.stroke();

          ctx.fillStyle = '#000';
          ctx.fillText(label, node.x, node.y + r + (4 / globalScale));

          node.__bckgDimensions = [
            Math.max(r * 2, bckgDimensions[0]),
            r * 2 + bckgDimensions[1]
          ];
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          const r = 8;
          bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - r, ...bckgDimensions);
        }}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        linkColor={() => '#000000'}
        linkOpacity={0.3}
        linkWidth={2 / 2}
      />
    </div>
  );
}

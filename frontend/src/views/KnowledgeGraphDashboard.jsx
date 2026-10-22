import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Network } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { BrutalSearchInput } from '../components/BrutalSearchInput';
import { BrutalSpinner } from '../components/BrutalSpinner';
import { BrutalCard } from '../components/BrutalCard';
import { GraphVisualizer } from '../components/knowledge-graph/GraphVisualizer';
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph';

export default function KnowledgeGraphDashboard() {
  const { projectId, repoId } = useParams();
  const navigate = useNavigate();
  
  const {
    query,
    setQuery,
    loading,
    selectedSymbol,
    graphData,
    selectSymbol
  } = useKnowledgeGraph(repoId);

  // Filter graphData nodes by query for the sidebar list
  const filteredNodes = useMemo(() => {
    if (!query) return graphData.nodes;
    return graphData.nodes.filter(node => 
      node.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [graphData.nodes, query]);

  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      <PageHeader 
        title="Codebase Knowledge Graph" 
        description="Interactive Semantic Map" 
        icon={Network}
        onBack={() => navigate(`/projects/${projectId}`)}
      />
      
      {loading ? (
         <BrutalCard className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <BrutalSpinner size="lg" text="Analyzing codebase relationships..." />
         </BrutalCard>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-6">
           {/* Main Graph Visualization inside a BrutalCard */}
           <BrutalCard className="flex-1 overflow-hidden" noPadding>
             <div className="w-full h-full relative flex flex-col bg-surface">
               {graphData.nodes.length > 0 ? (
                 <GraphVisualizer 
                   graphData={graphData} 
                   onNodeClick={(node) => selectSymbol(node.id)} 
                 />
               ) : (
                 <div className="m-auto font-bold uppercase tracking-widest opacity-50">No relationships ingested yet.</div>
               )}
             </div>
           </BrutalCard>
         </div>
      )}
    </div>
  );
}

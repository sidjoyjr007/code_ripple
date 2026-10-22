import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

export function useKnowledgeGraph(repoId) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  // Fetch full graph on mount or repo change
  useEffect(() => {
    if (!repoId) return;
    let active = true;
    
    const fetchFullGraph = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getFullGraph(repoId);
        if (active) setGraphData(data);
      } catch (error) {
        console.error("Failed to fetch full graph", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchFullGraph();
    
    return () => { active = false; };
  }, [repoId]);

  const selectSymbol = useCallback((symbolId) => {
    setSelectedSymbol(symbolId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSymbol(null);
  }, []);

  return {
    query,
    setQuery,
    loading,
    selectedSymbol,
    graphData,
    selectSymbol,
    clearSelection
  };
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, AlertTriangle, MessageSquare, Activity } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { AgentChatPanel } from '../components/agent/AgentChatPanel';
import { BrutalSpinner } from '../components/BrutalSpinner';
import { BrutalCard } from '../components/BrutalCard';
import { BrutalSelect } from '../components/BrutalSelect';
import { apiClient } from '../api/client';

export default function RippleAgentView() {
  const { projectId: urlProjectId, agentType: urlAgentType } = useParams();
  const navigate = useNavigate();
  const [activeProjectId, setActiveProjectId] = useState(urlProjectId || '');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  // Drive activeAgent from URL routing
  const activeAgent = urlAgentType || 'implication';
  const setActiveAgent = (type) => {
    if (activeProjectId) {
      navigate(`/projects/${activeProjectId}/rippleagent/${type}`);
    } else {
      navigate(`/rippleagent/${type}`);
    }
  };

  useEffect(() => {
    // Always fetch projects so we can populate the dropdown
    apiClient.getProjects().then(fetchedProjects => {
      setProjects(fetchedProjects);
      if (!activeProjectId && fetchedProjects.length > 0) {
        setActiveProjectId(fetchedProjects[0].id);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      <PageHeader
        title={`${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Agent`}
        description={`Codebase ${activeAgent === 'onboarding' ? 'Documentation' : 'Analysis'} Assistant`}
        icon={Bot}
        onBack={() => navigate('/rippleagent')}
      />

      {/* Project selector moved into AgentChatPanel */}

      {/* Tabs removed: Layout is now side-by-side when dashboard is active */}

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <BrutalCard className="flex h-full items-center justify-center">
            <BrutalSpinner size="lg" text="Loading context..." />
          </BrutalCard>
        ) : activeProjectId ? (
          <div className="h-full w-full">
            <AgentChatPanel
              projects={projects}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
              activeAgent={activeAgent}
              setActiveAgent={setActiveAgent}
            />
          </div>
        ) : (
          <BrutalCard className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-warning border-4 border-black flex items-center justify-center rounded-md">
              <AlertTriangle size={32} />
            </div>
            <h2 className="font-black text-2xl uppercase">No Projects Found</h2>
            <p className="font-bold opacity-70">Please create a project in the Projects tab first.</p>
          </BrutalCard>
        )}
      </div>
    </div>
  );
}

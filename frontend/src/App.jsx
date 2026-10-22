import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Network, Menu, GitBranch, Bot } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

import KnowledgeGraphDashboard from './views/KnowledgeGraphDashboard';
import RepositoryManager from './views/RepositoryManager';
import ProjectManager from './views/ProjectManager';
import AgentHubView from './views/AgentHubView';
import RippleAgentView from './views/RippleAgentView';
import ADLCView from './views/ADLCView';

import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectManager />} />
          <Route path="/projects/:projectId" element={<RepositoryManager />} />
          <Route path="/projects/:projectId/repos/:repoId/graph" element={<KnowledgeGraphDashboard />} />
          <Route path="/rippleagent" element={<AgentHubView />} />
          <Route path="/rippleagent/:agentType" element={<RippleAgentView />} />
          <Route path="/projects/:projectId/rippleagent/:agentType" element={<RippleAgentView />} />
          <Route path="/projects/:projectId/adlc" element={<ADLCView />} />
          <Route path="*" element={
            <div className="flex-1 flex items-center justify-center h-full">
              <h1 className="text-4xl font-bold text-muted-foreground">404: PAGE NOT FOUND</h1>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

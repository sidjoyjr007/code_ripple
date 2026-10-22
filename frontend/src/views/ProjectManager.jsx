import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Trash2, FolderOpen, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { BrutalCard } from '../components/BrutalCard';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput } from '../components/BrutalInput';
import { BrutalEmptyState } from '../components/BrutalEmptyState';

import { apiClient } from '../api/client';

export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!projectName) return;
    setLoading(true);
    try {
      await apiClient.addProject(projectName);
      setProjectName('');
      await fetchProjects();
    } catch (error) {
      console.error("Failed to add project", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.deleteProject(id);
      await fetchProjects();
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      <PageHeader 
        title="Enterprise Projects" 
        description="Manage multi-repo architectures and cross-service dependencies" 
        icon={Layers}
      />

      {/* Reusable BrutalCard for the Creation Form */}
      <BrutalCard className="mb-6 border-b-[8px] border-r-[8px]">
        <h2 className="font-black text-xl uppercase mb-4">Create New Project</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <div className="flex-1">
            <BrutalInput 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Global Payments Architecture"
              icon={<FolderOpen size={20} strokeWidth={3} />}
              className="bg-white text-lg"
            />
          </div>
          <BrutalButton type="submit" className="shrink-0 flex items-center gap-2 h-12">
            <Plus size={20} strokeWidth={3} /> Create Project
          </BrutalButton>
        </form>
      </BrutalCard>

      <div className="flex flex-col gap-4">
        <h2 className="font-black text-2xl uppercase tracking-tighter">Active Projects</h2>
        
        {projects.length === 0 ? (
          <BrutalEmptyState 
            icon={Layers}
            title="No Projects Found"
            description="Create a project above to group your microservice repositories."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => (
              <BrutalCard 
                key={project.id} 
                isInteractive 
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex flex-col gap-4 group border-b-[6px] border-r-[6px] hover:translate-x-1 hover:-translate-y-1 transition-transform"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-2xl break-all">{project.name}</h3>
                    <p className="text-sm font-bold opacity-70 mt-1 flex items-center gap-2">
                      <FolderOpen size={16} /> {project.repos} Connected Microservices
                    </p>
                  </div>
                  <div className={`px-3 py-1 text-xs font-black uppercase border-2 border-black ${
                    project.status === 'COMPLETED' ? 'bg-green-400' : 
                    project.status === 'SYNCING' ? 'bg-yellow-400 animate-pulse' : 
                    'bg-slate-300'
                  }`}>
                    {project.status}
                  </div>
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-4 border-t-4 border-black/10">
                  <span className="font-black text-sm uppercase flex items-center gap-2 group-hover:text-primary transition-colors">
                    Manage Architecture <ArrowRight size={18} strokeWidth={3} />
                  </span>
                  <BrutalButton 
                    variant="destructive"
                    size="icon"
                    onClick={(e) => handleDelete(project.id, e)}
                    title="Delete Project"
                  >
                    <Trash2 size={18} strokeWidth={3} />
                  </BrutalButton>
                </div>
              </BrutalCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

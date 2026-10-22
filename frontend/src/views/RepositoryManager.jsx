import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GitBranch, Plus, Trash2, ExternalLink, Link2, FolderX } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { BrutalCard } from '../components/BrutalCard';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput } from '../components/BrutalInput';
import { BrutalEmptyState } from '../components/BrutalEmptyState';
import { apiClient } from '../api/client';

export default function RepositoryManager() {
  const { projectId } = useParams();
  const [repos, setRepos] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchRepos = async () => {
    try {
      const data = await apiClient.getRepositories(projectId);
      setRepos(data);
    } catch (error) {
      console.error("Failed to fetch repos", error);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      await apiClient.addRepository(url, projectId);
      setUrl('');
      await fetchRepos();
    } catch (error) {
      console.error("Failed to add repo", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (repoId, e) => {
    e.stopPropagation();
    try {
      await apiClient.deleteRepository(repoId);
      await fetchRepos();
    } catch (error) {
      console.error("Failed to delete repo", error);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      <PageHeader 
        title="Repository Manager" 
        description="Manage Multi-Tenant Workspaces" 
        icon={GitBranch}
      />

      <BrutalCard className="mb-6">
        <h2 className="font-black text-xl uppercase mb-4">Add Repository</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <div className="flex-1">
            <BrutalInput 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              icon={<Link2 size={20} strokeWidth={3} />}
              disabled={loading}
              className="bg-white"
            />
          </div>
          <BrutalButton type="submit" disabled={loading} className="shrink-0 flex items-center gap-2 h-12">
            <Plus size={20} strokeWidth={3} /> {loading ? "Adding..." : "Ingest Repository"}
          </BrutalButton>
        </form>
      </BrutalCard>

      <div className="flex flex-col gap-4">
        <h2 className="font-black text-2xl uppercase tracking-tighter">Managed Workspaces</h2>
        {repos.length === 0 ? (
          <BrutalEmptyState 
            icon={FolderX}
            title="No Workspaces Found"
            description="Add a git repository URL above to begin indexing your first codebase."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map(repo => (
              <BrutalCard 
                key={repo.id} 
                isInteractive 
                onClick={() => navigate(`/projects/${projectId}/repos/${repo.id}/graph`)}
                className="flex flex-col gap-4 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg break-all">{repo.name}</h3>
                    <p className="text-sm font-bold opacity-70 break-all">{repo.url}</p>
                  </div>
                  <div className={`px-2 py-1 text-xs font-black uppercase border-2 border-black ${repo.status === 'COMPLETED' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'} rounded-md`}>
                    {repo.status}
                  </div>
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-4 border-t-2 border-black/10">
                  <span className="font-bold text-sm uppercase flex items-center gap-1 group-hover:text-primary transition-colors">
                    Explore Graph <ExternalLink size={16} strokeWidth={3} />
                  </span>
                  <BrutalButton 
                    variant="destructive"
                    size="icon"
                    onClick={(e) => handleDelete(repo.id, e)}
                    title="Delete Repository"
                  >
                    <Trash2 size={16} strokeWidth={3} />
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

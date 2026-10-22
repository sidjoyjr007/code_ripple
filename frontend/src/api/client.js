export const API_BASE = 'http://localhost:8000/api';

export const apiClient = {
  // Project Management
  getProjects: async () => {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  addProject: async (name) => {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to add project');
    return response.json();
  },

  deleteProject: async (projectId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
  },

  // Repository Management
  getRepositories: async (projectId = null) => {
    const url = projectId ? `${API_BASE}/repos?project_id=${projectId}` : `${API_BASE}/repos`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch repositories');
    return response.json();
  },

  addRepository: async (url, projectId = null) => {
    const response = await fetch(`${API_BASE}/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, project_id: projectId })
    });
    if (!response.ok) throw new Error('Failed to add repository');
    return response.json();
  },

  deleteRepository: async (repoId) => {
    const response = await fetch(`${API_BASE}/repos/${repoId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete repository');
    return response.json();
  },

  // Graph Data (Scoped by repoId)
  getSymbols: async (repoId, query = '') => {
    const response = await fetch(`${API_BASE}/repos/${repoId}/symbols?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to fetch symbols');
    return response.json();
  },
  
  getFullGraph: async (repoId) => {
    const response = await fetch(`${API_BASE}/repos/${repoId}/graph`);
    if (!response.ok) throw new Error('Failed to fetch full graph');
    return response.json();
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // Auth
  register: (email, password, fullName, companyName) =>
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, company_name: companyName })
    }).then(r => r.json()),

  login: (email, password) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  // Projects
  createProject: (token, projectName, description) =>
    fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ project_name: projectName, description })
    }).then(r => r.json()),

  listProjects: (token) =>
    fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),

  // Experiments
  createExperiment: (token, projectId, experimentName, description) =>
    fetch(`${API_URL}/projects/${projectId}/experiments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ experiment_name: experimentName, description })
    }).then(r => r.json()),

  listExperiments: (token, projectId) =>
    fetch(`${API_URL}/projects/${projectId}/experiments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),

  // Forecast
  triggerForecast: (token, experimentId) =>
    fetch(`${API_URL}/experiments/${experimentId}/forecast`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),

  getForecastResults: (token, experimentId, skuId = null) => {
    let url = `${API_URL}/experiments/${experimentId}/results`;
    if (skuId) url += `?sku_id=${skuId}`;
    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
  }
};

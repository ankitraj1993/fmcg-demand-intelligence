import { useState } from 'react';
import '../styles/Projects.css';

export default function Projects({ user }) {
  const [projects, setProjects] = useState([
    {
      id: 'proj-001',
      name: 'Q3 Demand Forecast',
      description: 'Forecast demand for 50 SKUs across 5 regions',
      skus: 50,
      regions: 5,
      dataPoints: 2500,
      lastUpdated: '2026-06-16',
      status: 'active',
      experiments: 3,
    },
    {
      id: 'proj-002',
      name: 'Supply Network Optimization',
      description: 'Optimize SKU movements to minimize costs',
      skus: 45,
      regions: 4,
      dataPoints: 1800,
      lastUpdated: '2026-06-15',
      status: 'active',
      experiments: 2,
    },
  ]);

  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredProjects = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-container projects-page">
      <div className="page-header">
        <div>
          <h2>Projects</h2>
          <p>Select a project and manage experiments</p>
        </div>
        <button className="btn-primary">+ New Project</button>
      </div>

      <div className="projects-layout">
        {/* Projects List */}
        <div className="projects-list-section">
          <div className="search-filter-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="list-header">
            <h3>Projects ({filteredProjects.length})</h3>
          </div>

          <div className="projects-list">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="project-header">
                  <h4>{project.name}</h4>
                  <span className={`status-badge ${project.status}`}>
                    {project.status}
                  </span>
                </div>
                <p className="project-desc">{project.description}</p>
                <div className="project-stats">
                  <div className="stat">
                    <span className="stat-label">SKUs</span>
                    <span className="stat-value">{project.skus}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Regions</span>
                    <span className="stat-value">{project.regions}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Experiments</span>
                    <span className="stat-value">{project.experiments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Details */}
        {selectedProject && (
          <div className="project-details-section">
            <div className="details-header">
              <h3>{selectedProject.name}</h3>
            </div>

            <div className="detail-section">
              <h4>Overview</h4>
              <p className="detail-text">{selectedProject.description}</p>
            </div>

            <div className="detail-section">
              <h4>Data Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">SKUs</span>
                  <span className="value">{selectedProject.skus}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Regions</span>
                  <span className="value">{selectedProject.regions}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Data Points</span>
                  <span className="value">{selectedProject.dataPoints.toLocaleString()}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Last Updated</span>
                  <span className="value">{selectedProject.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Experiments ({selectedProject.experiments})</h4>
              <div className="experiments-list">
                <div className="experiment-item">
                  <span className="exp-name">Baseline Forecast</span>
                  <span className="exp-status">Completed</span>
                </div>
                <div className="experiment-item">
                  <span className="exp-name">With Exogenous Factors</span>
                  <span className="exp-status">Running</span>
                </div>
                <div className="experiment-item">
                  <span className="exp-name">Network Optimization</span>
                  <span className="exp-status">Completed</span>
                </div>
              </div>
              <button className="btn-secondary" style={{ marginTop: '12px', width: '100%' }}>
                + New Experiment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { api } from '../config/api';
import '../styles/Persona.css';

export default function DemandPlanner({ user }) {
  const [projects, setProjects] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newExperimentName, setNewExperimentName] = useState('');

  const handleCreateProject = async () => {
    if (!newProjectName) return;
    const token = localStorage.getItem('token');
    const result = await api.createProject(token, newProjectName, '');
    setProjects([...projects, result]);
    setNewProjectName('');
  };

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    const token = localStorage.getItem('token');
    const exps = await api.listExperiments(token, project.project_id);
    setExperiments(exps);
  };

  const handleCreateExperiment = async () => {
    if (!newExperimentName || !selectedProject) return;
    const token = localStorage.getItem('token');
    const result = await api.createExperiment(token, selectedProject.project_id, newExperimentName, '');
    setExperiments([...experiments, result]);
    setNewExperimentName('');
  };

  const handleTriggerForecast = async (experimentId) => {
    const token = localStorage.getItem('token');
    const result = await api.triggerForecast(token, experimentId);
    alert('Forecast queued: ' + result.status);
  };

  return (
    <div className="persona-container">
      <h1>📊 Demand Planner</h1>

      <section className="section">
        <h2>Projects</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="New project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <button onClick={handleCreateProject}>Create Project</button>
        </div>

        <div className="list">
          {projects.length === 0 ? (
            <p>No projects yet. Create one to start!</p>
          ) : (
            projects.map((p) => (
              <div
                key={p.project_id}
                className={`item ${selectedProject?.project_id === p.project_id ? 'active' : ''}`}
                onClick={() => handleSelectProject(p)}
              >
                {p.project_name}
              </div>
            ))
          )}
        </div>
      </section>

      {selectedProject && (
        <section className="section">
          <h2>Experiments in {selectedProject.project_name}</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="New experiment name"
              value={newExperimentName}
              onChange={(e) => setNewExperimentName(e.target.value)}
            />
            <button onClick={handleCreateExperiment}>Create Experiment</button>
          </div>

          <div className="list">
            {experiments.length === 0 ? (
              <p>No experiments. Create one!</p>
            ) : (
              experiments.map((exp) => (
                <div key={exp.experiment_id} className="item">
                  <div>{exp.experiment_name}</div>
                  <button onClick={() => handleTriggerForecast(exp.experiment_id)}>
                    Run Forecast
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <section className="info-box">
        <h3>💡 Tip: What-If Scenarios</h3>
        <p>1. Create a project (e.g., "Q3 Planning")</p>
        <p>2. Create experiments for different scenarios</p>
        <p>3. Click "Run Forecast" to generate predictions</p>
        <p>4. Compare results across scenarios</p>
      </section>
    </div>
  );
}

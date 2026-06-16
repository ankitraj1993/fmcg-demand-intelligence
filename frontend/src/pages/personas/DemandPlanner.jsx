import { useState } from 'react';
import '../../styles/personas.css';

export default function DemandPlanner({ user }) {
  const [activeSection, setActiveSection] = useState('projects');

  return (
    <div className="persona-container demand-planner">
      <div className="persona-sidebar">
        <div className="section-menu">
          <button
            className={`menu-item ${activeSection === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveSection('projects')}
          >
            📁 Projects
          </button>
          <button
            className={`menu-item ${activeSection === 'experiments' ? 'active' : ''}`}
            onClick={() => setActiveSection('experiments')}
          >
            🧪 Experiments
          </button>
          <button
            className={`menu-item ${activeSection === 'consensus' ? 'active' : ''}`}
            onClick={() => setActiveSection('consensus')}
          >
            🤝 Consensus
          </button>
          <button
            className={`menu-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            📊 Reports
          </button>
        </div>
      </div>

      <div className="persona-content">
        {activeSection === 'projects' && <ProjectsSection />}
        {activeSection === 'experiments' && <ExperimentsSection />}
        {activeSection === 'consensus' && <ConsensusSection />}
        {activeSection === 'reports' && <ReportsSection />}
      </div>
    </div>
  );
}

function ProjectsSection() {
  return (
    <div className="section">
      <h2>Projects</h2>
      <p>No projects yet. Create your first project to get started.</p>
      <button className="btn-primary">+ New Project</button>
    </div>
  );
}

function ExperimentsSection() {
  return (
    <div className="section">
      <h2>Experiments</h2>
      <p>Run and manage demand forecasting experiments.</p>
    </div>
  );
}

function ConsensusSection() {
  return (
    <div className="section">
      <h2>Consensus Planning</h2>
      <p>Collaborate with stakeholders on final demand numbers.</p>
    </div>
  );
}

function ReportsSection() {
  return (
    <div className="section">
      <h2>Reports</h2>
      <p>View generated forecasting and consensus reports.</p>
    </div>
  );
}

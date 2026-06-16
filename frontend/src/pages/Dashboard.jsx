import { useState } from 'react';
import Projects from './Projects';
import Runs from './Runs';
import SupplyNetwork from './SupplyNetwork';
import Scenarios from './Scenarios';
import Execution from './Execution';
import Analytics from './Analytics';
import '../styles/Dashboard.css';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('projects');

  const tabs = [
    { id: 'projects', label: 'Projects', desc: 'Upload data & manage projects' },
    { id: 'runs', label: 'Runs', desc: 'Forecast results & analysis' },
    { id: 'supply-network', label: 'Supply Network', desc: 'Network gaps & movements' },
    { id: 'scenarios', label: 'Scenarios', desc: 'What-if analysis' },
    { id: 'execution', label: 'Execution', desc: 'Implement decisions' },
    { id: 'analytics', label: 'Analytics', desc: 'Performance & KPIs' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <Projects user={user} />;
      case 'runs':
        return <Runs user={user} />;
      case 'supply-network':
        return <SupplyNetwork user={user} />;
      case 'scenarios':
        return <Scenarios user={user} />;
      case 'execution':
        return <Execution user={user} />;
      case 'analytics':
        return <Analytics user={user} />;
      default:
        return <Projects user={user} />;
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="logo">FMCG Demand Intelligence</h1>
          <span className="subtitle">Agent-Driven Supply Chain Optimization</span>
        </div>
        <div className="header-right">
          <span className="user-name">{user.email}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              title={tab.desc}
            >
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="dashboard-content">
        {renderContent()}
      </main>
    </div>
  );
}

import { useState } from 'react';
import DemandPlanner from './DemandPlanner';
import SupplyChain from './SupplyChain';
import Analyst from './Analyst';
import '../styles/Dashboard.css';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('demand');

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>FMCG AI</h2>
          <p className="company">{user.email}</p>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'demand' ? 'active' : ''}`}
            onClick={() => setActiveTab('demand')}
          >
            📊 Demand Planner
          </button>
          <button
            className={`nav-item ${activeTab === 'supply' ? 'active' : ''}`}
            onClick={() => setActiveTab('supply')}
          >
            📦 Supply Chain
          </button>
          <button
            className={`nav-item ${activeTab === 'analyst' ? 'active' : ''}`}
            onClick={() => setActiveTab('analyst')}
          >
            📈 Analyst
          </button>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {activeTab === 'demand' && <DemandPlanner user={user} />}
        {activeTab === 'supply' && <SupplyChain user={user} />}
        {activeTab === 'analyst' && <Analyst user={user} />}
      </main>
    </div>
  );
}

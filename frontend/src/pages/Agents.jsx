import { useState } from 'react';
import '../styles/Pages.css';

export default function Agents({ user }) {
  const [agents, setAgents] = useState([
    {
      id: 'demand-forecast',
      name: 'Demand Forecast Agent',
      status: 'active',
      objective: 'Predict demand for 50 SKUs across regions',
      description: 'ML-based demand forecasting using SARIMA, XGBoost, Prophet',
      tools: ['Time Series Analysis', 'ML Model Selection', 'Cross-validation'],
      lastRun: '2026-06-16 14:22',
      accuracy: '92.3%',
    },
    {
      id: 'gap-analysis',
      name: 'Supply-Demand Gap Agent',
      status: 'active',
      objective: 'Identify stockout & overstock risks',
      description: 'Compares forecasted demand vs current inventory levels',
      tools: ['Gap Detection', 'Risk Scoring', 'Alert Generation'],
      lastRun: '2026-06-16 14:25',
      accuracy: '98.1%',
    },
    {
      id: 'network-opt',
      name: 'Network Optimization Agent',
      status: 'active',
      objective: 'Optimize SKU movement across regions',
      description: 'OR-based network flow optimization to minimize costs & risks',
      tools: ['Linear Programming', 'Network Flow', 'Cost Minimization'],
      lastRun: '2026-06-16 14:28',
      accuracy: 'N/A',
    },
    {
      id: 'scenario-sim',
      name: 'Scenario Simulation Agent',
      status: 'idle',
      objective: 'Test what-if scenarios',
      description: 'Monte Carlo simulation for price/demand/supply variations',
      tools: ['Simulation Engine', 'Sensitivity Analysis', 'Outcome Modeling'],
      lastRun: 'Never',
      accuracy: 'N/A',
    },
  ]);

  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredAgents = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.objective.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-container agents-page">
      <div className="page-header">
        <div>
          <h2>Agents</h2>
          <p>Define objectives & manage autonomous agents for optimization</p>
        </div>
        <button className="btn-primary">+ New Agent</button>
      </div>

      <div className="agents-layout">
        {/* Agent List */}
        <div className="agents-list">
          <div className="search-filter-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search agents..."
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
              <option value="idle">Idle</option>
            </select>
          </div>

          <div className="list-header">
            <h3>Agents ({filteredAgents.length})</h3>
          </div>
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className={`agent-card ${selectedAgent.id === agent.id ? 'selected' : ''} ${agent.status}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="agent-status">
                <span className={`status-dot ${agent.status}`}></span>
                <span className="status-text">{agent.status}</span>
              </div>
              <h4>{agent.name}</h4>
              <p className="agent-desc">{agent.description.substring(0, 50)}...</p>
              <div className="agent-meta">
                <span className="last-run">Last run: {agent.lastRun}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Agent Details */}
        <div className="agent-details">
          {selectedAgent && (
            <>
              <div className="detail-header">
                <h3>{selectedAgent.name}</h3>
                <div className="detail-actions">
                  <button className="btn-secondary">Edit Objective</button>
                  <button className="btn-primary">Run Now</button>
                </div>
              </div>

              <div className="detail-section">
                <h4>Objective</h4>
                <div className="objective-box">
                  <p>{selectedAgent.objective}</p>
                </div>
              </div>

              <div className="detail-section">
                <h4>Description</h4>
                <p className="detail-text">{selectedAgent.description}</p>
              </div>

              <div className="detail-section">
                <h4>Tools & Capabilities</h4>
                <div className="tools-grid">
                  {selectedAgent.tools.map((tool) => (
                    <div key={tool} className="tool-badge">
                      {tool}
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Performance</h4>
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Last Run</span>
                    <span className="metric-value">{selectedAgent.lastRun}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Accuracy</span>
                    <span className="metric-value">{selectedAgent.accuracy}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Status</span>
                    <span className={`metric-value ${selectedAgent.status}`}>
                      {selectedAgent.status}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

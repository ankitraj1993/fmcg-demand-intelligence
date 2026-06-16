import { useState } from 'react';
import '../styles/Pages.css';

export default function Runs({ user }) {
  const [runs, setRuns] = useState([
    {
      id: 'run-001',
      type: 'Forecast',
      agent: 'Demand Forecast Agent',
      status: 'completed',
      startTime: '2026-06-16 14:20',
      endTime: '2026-06-16 14:22',
      duration: '2.3 min',
      skus: 50,
      regions: 5,
      periods: 13,
      mape: '4.2%',
      notes: 'Synthetic data forecast',
    },
    {
      id: 'run-002',
      type: 'Gap Analysis',
      agent: 'Supply-Demand Gap Agent',
      status: 'completed',
      startTime: '2026-06-16 14:23',
      endTime: '2026-06-16 14:25',
      duration: '1.8 min',
      skus: 50,
      regions: 5,
      gapsIdentified: 12,
      mape: 'N/A',
      notes: 'Identified 12 critical gaps',
    },
  ]);

  const [selectedRun, setSelectedRun] = useState(runs[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRuns = runs.filter((r) => {
    const matchSearch = r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.agent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-container runs-page">
      <div className="page-header">
        <div>
          <h2>Optimization Runs</h2>
          <p>View history and details of forecast & optimization runs</p>
        </div>
        <button className="btn-primary">+ New Run</button>
      </div>

      <div className="runs-layout">
        {/* Runs List */}
        <div className="runs-list">
          <div className="search-filter-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search runs..."
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
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="list-header">
            <h3>Recent Runs ({filteredRuns.length})</h3>
          </div>
          {filteredRuns.map((run) => (
            <div
              key={run.id}
              className={`run-card ${selectedRun.id === run.id ? 'selected' : ''}`}
              onClick={() => setSelectedRun(run)}
            >
              <div className="run-header">
                <h4>{run.type}</h4>
                <span className={`status-badge ${run.status}`}>{run.status}</span>
              </div>
              <p className="run-agent">{run.agent}</p>
              <div className="run-meta">
                <span>{run.startTime}</span>
                <span>•</span>
                <span>{run.duration}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Run Details */}
        <div className="run-details">
          {selectedRun && (
            <>
              <div className="detail-header">
                <h3>{selectedRun.type} Run</h3>
                <span className={`status-badge ${selectedRun.status}`}>
                  {selectedRun.status}
                </span>
              </div>

              <div className="detail-section">
                <h4>Execution Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Agent</span>
                    <span className="value">{selectedRun.agent}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Started</span>
                    <span className="value">{selectedRun.startTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Completed</span>
                    <span className="value">{selectedRun.endTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Duration</span>
                    <span className="value">{selectedRun.duration}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Scope</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">SKUs</span>
                    <span className="value">{selectedRun.skus}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Regions</span>
                    <span className="value">{selectedRun.regions}</span>
                  </div>
                  {selectedRun.periods && (
                    <div className="detail-item">
                      <span className="label">Periods</span>
                      <span className="value">{selectedRun.periods}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Results</h4>
                <div className="results-grid">
                  {selectedRun.mape && (
                    <div className="result-item">
                      <span className="label">MAPE</span>
                      <span className="value">{selectedRun.mape}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

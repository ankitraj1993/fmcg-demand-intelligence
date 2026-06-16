import '../styles/Pages.css';

export default function Analytics({ user }) {
  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <div>
          <h2>Analytics & KPIs</h2>
          <p>Monitor performance metrics and optimization effectiveness</p>
        </div>
      </div>

      <div className="analytics-container">
        <div className="kpi-grid">
          <div className="kpi-card">
            <h4>Forecast Accuracy</h4>
            <span className="kpi-value">92.3%</span>
            <p className="kpi-label">Avg MAPE</p>
          </div>
          <div className="kpi-card">
            <h4>Service Level</h4>
            <span className="kpi-value">97.8%</span>
            <p className="kpi-label">Target: 98%</p>
          </div>
          <div className="kpi-card">
            <h4>Cost Savings</h4>
            <span className="kpi-value">₹5.2L</span>
            <p className="kpi-label">This Month</p>
          </div>
          <div className="kpi-card">
            <h4>Stockout Events</h4>
            <span className="kpi-value">2</span>
            <p className="kpi-label">vs 8 last month</p>
          </div>
        </div>

        <div className="analytics-section">
          <h3>Performance Trends</h3>
          <p>Coming soon: Charts, trends, and detailed analytics</p>
        </div>
      </div>
    </div>
  );
}

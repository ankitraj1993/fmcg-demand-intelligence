export default function Analyst({ user }) {
  return (
    <div className="persona-container analyst">
      <h2>Analyst Tools</h2>
      <div className="analyst-grid">
        <div className="analyst-card">
          <h3>🚨 Anomaly Detection</h3>
          <p>Auto-detect unusual patterns in data</p>
        </div>
        <div className="analyst-card">
          <h3>💡 Insights Generation</h3>
          <p>AI agent generates actionable insights</p>
        </div>
        <div className="analyst-card">
          <h3>🔍 Root Cause Analysis</h3>
          <p>Identify why forecasts deviate</p>
        </div>
        <div className="analyst-card">
          <h3>📊 Custom Reports</h3>
          <p>Generate persona-specific reports</p>
        </div>
      </div>
    </div>
  );
}

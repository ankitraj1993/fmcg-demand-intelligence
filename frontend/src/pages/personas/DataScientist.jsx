export default function DataScientist({ user }) {
  return (
    <div className="persona-container data-scientist">
      <h2>Data Scientist Tools</h2>
      <div className="ds-grid">
        <div className="ds-card">
          <h3>🤖 Auto Model Selection</h3>
          <p>AI agent suggests best models for your data</p>
        </div>
        <div className="ds-card">
          <h3>🔧 Feature Engineering</h3>
          <p>Auto-generate and test new features</p>
        </div>
        <div className="ds-card">
          <h3>⚡ Hyperparameter Tuning</h3>
          <p>Optimize model parameters automatically</p>
        </div>
        <div className="ds-card">
          <h3>📈 Model Comparison</h3>
          <p>Compare multiple models side-by-side</p>
        </div>
      </div>
    </div>
  );
}

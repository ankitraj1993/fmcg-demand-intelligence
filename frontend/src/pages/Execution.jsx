import '../styles/Pages.css';

export default function Execution({ user }) {
  return (
    <div className="page-container execution-page">
      <div className="page-header">
        <div>
          <h2>Execution</h2>
          <p>Implement optimization decisions & track execution status</p>
        </div>
        <button className="btn-primary">Execute Plan</button>
      </div>

      <div className="execution-container">
        <div className="execution-section">
          <h3>Pending Decisions</h3>
          <p>Ready to execute based on latest optimization run</p>
        </div>

        <div className="execution-section">
          <h3>Executed Orders</h3>
          <p>Track implemented movements and status</p>
        </div>

        <div className="execution-section">
          <h3>Alerts</h3>
          <p>Critical stockout & overstock alerts requiring action</p>
        </div>
      </div>
    </div>
  );
}

import '../styles/Pages.css';

export default function SupplyNetwork({ user }) {
  return (
    <div className="page-container supply-network-page">
      <div className="page-header">
        <div>
          <h2>Supply Network</h2>
          <p>Visualize demand-supply gaps & recommended movements</p>
        </div>
        <button className="btn-primary">Refresh Network</button>
      </div>

      <div className="network-container">
        <div className="network-section">
          <h3>Network Map (Coming Soon)</h3>
          <p>Region-wise demand, supply, gaps, and recommended SKU movements</p>
        </div>

        <div className="network-section">
          <h3>Movement Recommendations</h3>
          <div className="movements-table">
            <div className="table-header">
              <span>SKU</span>
              <span>From Region</span>
              <span>To Region</span>
              <span>Quantity</span>
              <span>Priority</span>
              <span>Est. Savings</span>
            </div>
            <div className="table-row">
              <span>SKU-001</span>
              <span>Region-1</span>
              <span>Region-2</span>
              <span>500</span>
              <span className="priority-high">High</span>
              <span className="savings">₹8.5K</span>
            </div>
            <div className="table-row">
              <span>SKU-015</span>
              <span>Region-3</span>
              <span>Region-5</span>
              <span>320</span>
              <span className="priority-medium">Medium</span>
              <span className="savings">₹5.2K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

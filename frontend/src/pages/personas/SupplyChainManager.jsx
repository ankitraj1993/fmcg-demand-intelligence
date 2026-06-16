export default function SupplyChainManager({ user }) {
  return (
    <div className="persona-container supply-chain">
      <h2>Supply Chain Tools</h2>
      <div className="sc-grid">
        <div className="sc-card">
          <h3>📦 Inventory Optimization</h3>
          <p>Auto-calculate optimal stock levels</p>
        </div>
        <div className="sc-card">
          <h3>⚠️ Stockout Risk</h3>
          <p>Identify products at risk of stockout</p>
        </div>
        <div className="sc-card">
          <h3>🛡️ Safety Stock</h3>
          <p>Recommend safety stock by SKU</p>
        </div>
        <div className="sc-card">
          <h3>📋 Procurement Plan</h3>
          <p>Generate automated procurement orders</p>
        </div>
      </div>
    </div>
  );
}

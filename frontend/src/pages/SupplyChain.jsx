import { useState } from 'react';
import '../styles/Persona.css';

export default function SupplyChain({ user }) {
  const [alerts] = useState([
    {
      id: 1,
      sku: 'SKU_102',
      region: 'Mumbai DC',
      type: 'STOCKOUT_RISK',
      severity: 'high',
      message: 'SKU_102 will run out on July 15. Current inventory: 50K units.',
      action: 'Increase weekly replenishment by 5K units'
    },
    {
      id: 2,
      sku: 'SKU_045',
      region: 'Delhi DC',
      type: 'LOW_FORECAST_ACCURACY',
      severity: 'medium',
      message: 'Forecast accuracy for SKU_045 degraded to 18% MAPE',
      action: 'Review recent demand patterns'
    }
  ]);

  return (
    <div className="persona-container">
      <h1>📦 Supply Chain Management</h1>

      <section className="section">
        <h2>Active Alerts</h2>
        <div className="alerts">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert alert-${alert.severity}`}>
              <div className="alert-header">
                <span className="sku">{alert.sku}</span>
                <span className="region">{alert.region}</span>
              </div>
              <p className="message">{alert.message}</p>
              <p className="action">✓ {alert.action}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>DC Capacity Overview</h2>
        <div className="capacity-grid">
          {['Mumbai', 'Delhi', 'Bangalore', 'Kolkata'].map((dc) => (
            <div key={dc} className="capacity-card">
              <h3>{dc}</h3>
              <p className="capacity-bar">████████░░ 80%</p>
              <p className="capacity-text">80K / 100K units</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-box">
        <h3>💡 Tip: Optimize Inventory</h3>
        <p>• Monitor stockout risks in real-time</p>
        <p>• Adjust safety stock based on forecast confidence</p>
        <p>• Balance holding costs vs service level</p>
      </section>
    </div>
  );
}

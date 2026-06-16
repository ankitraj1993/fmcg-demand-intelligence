import { useState } from 'react';
import '../styles/Persona.css';

export default function Analyst({ user }) {
  const [metrics] = useState({
    overall_mape: 12.3,
    model_performance: [
      { model: 'XGBoost', mape: 11.8, rmse: 45.2 },
      { model: 'SARIMA', mape: 14.5, rmse: 52.1 },
      { model: 'Prophet', mape: 16.2, rmse: 58.3 }
    ],
    top_skus: [
      { sku: 'SKU_102', mape: 8.2, forecast_count: 92 },
      { sku: 'SKU_045', mape: 9.5, forecast_count: 87 },
      { sku: 'SKU_201', mape: 10.1, forecast_count: 92 }
    ],
    data_quality: {
      total_records: 1524000,
      outliers_detected: 324,
      missing_values: 0
    }
  });

  return (
    <div className="persona-container">
      <h1>📈 Model Performance & Analysis</h1>

      <section className="section">
        <h2>Overall Accuracy</h2>
        <div className="metric-box large">
          <div className="metric-value">{metrics.overall_mape}%</div>
          <div className="metric-label">Average MAPE</div>
        </div>
      </section>

      <section className="section">
        <h2>Model Comparison</h2>
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>MAPE</th>
              <th>RMSE</th>
            </tr>
          </thead>
          <tbody>
            {metrics.model_performance.map((m) => (
              <tr key={m.model}>
                <td>{m.model}</td>
                <td>{m.mape}%</td>
                <td>{m.rmse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>Top Performing SKUs</h2>
        <table className="metrics-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>MAPE</th>
              <th>Forecasts</th>
            </tr>
          </thead>
          <tbody>
            {metrics.top_skus.map((s) => (
              <tr key={s.sku}>
                <td>{s.sku}</td>
                <td>{s.mape}%</td>
                <td>{s.forecast_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>Data Quality</h2>
        <div className="quality-grid">
          <div className="quality-metric">
            <div className="number">{metrics.data_quality.total_records.toLocaleString()}</div>
            <div className="label">Total Records</div>
          </div>
          <div className="quality-metric">
            <div className="number">{metrics.data_quality.outliers_detected}</div>
            <div className="label">Outliers Detected</div>
          </div>
          <div className="quality-metric">
            <div className="number">{metrics.data_quality.missing_values}</div>
            <div className="label">Missing Values</div>
          </div>
        </div>
      </section>

      <section className="info-box">
        <h3>💡 Key Insights</h3>
        <p>✓ XGBoost is best performer (11.8% MAPE)</p>
        <p>✓ 324 outliers detected and flagged</p>
        <p>✓ SKU_102 has highest forecast accuracy</p>
      </section>
    </div>
  );
}

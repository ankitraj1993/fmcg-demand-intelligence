import { useState } from 'react';
import '../styles/Pages.css';

export default function Scenarios({ user }) {
  const [scenarios, setScenarios] = useState([
    {
      id: 'scenario-1',
      name: 'Price Increase +10%',
      description: 'Impact of 10% price increase on demand',
      status: 'completed',
      demandImpact: '-5.2%',
      revenueImpact: '+3.8%',
      stockoutRisk: '+1.2%',
    },
    {
      id: 'scenario-2',
      name: 'Supply Disruption',
      description: 'Region-2 supply cut by 30% for 2 weeks',
      status: 'completed',
      demandImpact: 'N/A',
      revenueImpact: '-12.5%',
      stockoutRisk: '+45%',
    },
  ]);

  return (
    <div className="page-container scenarios-page">
      <div className="page-header">
        <div>
          <h2>Scenarios & What-If Analysis</h2>
          <p>Test different market conditions & their impact on supply network</p>
        </div>
        <button className="btn-primary">+ Create Scenario</button>
      </div>

      <div className="scenarios-grid">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="scenario-card">
            <div className="scenario-header">
              <h4>{scenario.name}</h4>
              <span className={`status-badge ${scenario.status}`}>{scenario.status}</span>
            </div>
            <p className="scenario-desc">{scenario.description}</p>
            <div className="scenario-results">
              <div className="result">
                <span className="label">Demand Impact</span>
                <span className="value">{scenario.demandImpact}</span>
              </div>
              <div className="result">
                <span className="label">Revenue Impact</span>
                <span className={`value ${scenario.revenueImpact.includes('-') ? 'negative' : 'positive'}`}>
                  {scenario.revenueImpact}
                </span>
              </div>
              <div className="result">
                <span className="label">Stockout Risk</span>
                <span className="value warning">{scenario.stockoutRisk}</span>
              </div>
            </div>
            <button className="btn-secondary">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}

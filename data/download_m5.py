# Create data/download_m5.py
import pandas as pd
import requests
import zipfile
from pathlib import Path

def download_m5():
    """Download M5 Walmart dataset from Kaggle"""
    # Manual download: https://www.kaggle.com/competitions/m5-forecasting-accuracy/data
    # OR use synthetic data generator below
    
def generate_synthetic_fmcg(num_skus=50, num_days=730):
    """Generate synthetic FMCG data"""
    import numpy as np
    from datetime import datetime, timedelta
    
    np.random.seed(42)
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(num_days)]
    
    data = []
    for sku_id in range(1, num_skus + 1):
        base_demand = np.random.randint(100, 500)
        for i, date in enumerate(dates):
            # Seasonal pattern
            seasonal = 1 + 0.3 * np.sin(2 * np.pi * i / 365)
            # Weekly pattern (weekend spike)
            weekly = 1.2 if date.weekday() >= 5 else 1.0
            # Random noise
            noise = np.random.normal(1, 0.1)
            # Promotional effect (10% of days)
            promo = np.random.choice([1.0, 1.5], p=[0.9, 0.1])
            
            sales = int(base_demand * seasonal * weekly * noise * promo)
            
            data.append({
                'sku_id': f'SKU_{sku_id:03d}',
                'date': date.strftime('%Y-%m-%d'),
                'sales_units': sales,
                'promo_flag': promo > 1.0,
                'category': f'Category_{sku_id % 5 + 1}'
            })
    
    df = pd.DataFrame(data)
    df.to_csv('data/fmcg_sales.csv', index=False)
    print(f"Generated {len(df)} records for {num_skus} SKUs")
    return df

if __name__ == "__main__":
    generate_synthetic_fmcg()
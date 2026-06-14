# Create models/baseline_forecast.py
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import requests

def fetch_data(sku_id, days=365):
    """Fetch data from Data MCP"""
    response = requests.get(
        f"http://localhost:8001/fetch_sales_history",
        params={"sku_id": sku_id, "days": days}
    )
    data = response.json()['data']
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.set_index('date')
    return df['sales_units']

def forecast_ets(sku_id, horizon=30):
    """Simple ETS forecast"""
    # Get data
    sales = fetch_data(sku_id)
    
    # Fit ETS model
    model = ExponentialSmoothing(
        sales,
        seasonal_periods=7,  # Weekly seasonality
        trend='add',
        seasonal='add'
    )
    fit = model.fit()
    
    # Forecast
    forecast = fit.forecast(steps=horizon)
    
    return {
        "sku_id": sku_id,
        "model": "ETS",
        "forecast": forecast.tolist(),
        "dates": [sales.index[-1] + pd.Timedelta(days=i) for i in range(1, horizon+1)]
    }

if __name__ == "__main__":
    # Test
    result = forecast_ets("SKU_001", horizon=7)
    print(f"✅ 7-day forecast for SKU_001:")
    for date, value in zip(result['dates'], result['forecast']):
        print(f"  {date.strftime('%Y-%m-%d')}: {value:.0f} units")
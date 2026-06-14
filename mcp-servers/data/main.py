# Create mcp-servers/data/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd
from datetime import datetime, timedelta

app = FastAPI(title="Data MCP Server")

# Load data (in production, this would be from database)
df = pd.read_csv('../../data/fmcg_sales.csv')
df['date'] = pd.to_datetime(df['date'])

class SalesHistoryRequest(BaseModel):
    sku_id: str
    days: int = 90

class SalesHistoryResponse(BaseModel):
    sku_id: str
    data: list
    start_date: str
    end_date: str
    total_records: int

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Data MCP"}

@app.get("/fetch_sales_history", response_model=SalesHistoryResponse)
def fetch_sales_history(sku_id: str, days: int = 90):
    """Fetch sales history for a SKU"""
    sku_data = df[df['sku_id'] == sku_id].copy()
    
    if sku_data.empty:
        raise HTTPException(status_code=404, detail=f"SKU {sku_id} not found")
    
    # Get last N days
    end_date = sku_data['date'].max()
    start_date = end_date - timedelta(days=days)
    sku_data = sku_data[sku_data['date'] >= start_date]
    
    # Convert to list of dicts
    records = sku_data.to_dict('records')
    for record in records:
        record['date'] = record['date'].strftime('%Y-%m-%d')
    
    return {
        "sku_id": sku_id,
        "data": records,
        "start_date": start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "total_records": len(records)
    }

@app.get("/fetch_sku_metadata")
def fetch_sku_metadata(sku_id: str):
    """Get metadata for a SKU"""
    sku_data = df[df['sku_id'] == sku_id]
    
    if sku_data.empty:
        raise HTTPException(status_code=404, detail=f"SKU {sku_id} not found")
    
    return {
        "sku_id": sku_id,
        "category": sku_data['category'].iloc[0],
        "avg_daily_sales": float(sku_data['sales_units'].mean()),
        "std_daily_sales": float(sku_data['sales_units'].std()),
        "first_sale_date": sku_data['date'].min().strftime('%Y-%m-%d'),
        "last_sale_date": sku_data['date'].max().strftime('%Y-%m-%d')
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
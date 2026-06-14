# mcp-servers/data/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd
from datetime import datetime, timedelta
import boto3
from io import StringIO
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS S3 Configuration
s3_client = boto3.client('s3', region_name='ap-south-1')
bucket_name = 'fmcg-demand-intel-ankit'

# FastAPI app
app = FastAPI(title="Data MCP Server")

# Global dataframe (loaded at startup)
df = None

# Pydantic models
class SalesHistoryRequest(BaseModel):
    sku_id: str
    days: int = 90

class SalesHistoryResponse(BaseModel):
    sku_id: str
    data: list
    start_date: str
    end_date: str
    total_records: int

# Load data from S3
def load_data_from_s3():
    """Load sales data from S3"""
    try:
        logger.info(f"Loading data from S3: s3://{bucket_name}/data/fmcg_sales.csv")
        obj = s3_client.get_object(Bucket=bucket_name, Key='data/fmcg_sales.csv')
        csv_data = obj['Body'].read().decode('utf-8')
        df = pd.read_csv(StringIO(csv_data))
        df['date'] = pd.to_datetime(df['date'])
        logger.info(f"✅ Loaded {len(df)} records from S3")
        return df
    except Exception as e:
        logger.error(f"❌ Failed to load from S3: {e}")
        raise

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Data MCP Server",
        "records_loaded": len(df) if df is not None else 0
    }

# Fetch sales history
@app.get("/fetch_sales_history", response_model=SalesHistoryResponse)
def fetch_sales_history(sku_id: str, days: int = 90):
    """Fetch sales history for a SKU"""
    if df is None:
        raise HTTPException(status_code=503, detail="Data not loaded yet")
    
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

# Fetch SKU metadata
@app.get("/fetch_sku_metadata")
def fetch_sku_metadata(sku_id: str):
    """Get metadata for a SKU"""
    if df is None:
        raise HTTPException(status_code=503, detail="Data not loaded yet")
    
    sku_data = df[df['sku_id'] == sku_id]
    
    if sku_data.empty:
        raise HTTPException(status_code=404, detail=f"SKU {sku_id} not found")
    
    return {
        "sku_id": sku_id,
        "category": sku_data['category'].iloc[0],
        "avg_daily_sales": float(sku_data['sales_units'].mean()),
        "std_daily_sales": float(sku_data['sales_units'].std()),
        "min_daily_sales": int(sku_data['sales_units'].min()),
        "max_daily_sales": int(sku_data['sales_units'].max()),
        "first_sale_date": sku_data['date'].min().strftime('%Y-%m-%d'),
        "last_sale_date": sku_data['date'].max().strftime('%Y-%m-%d')
    }

# Fetch all unique SKUs
@app.get("/fetch_all_skus")
def fetch_all_skus():
    """Get list of all SKUs"""
    if df is None:
        raise HTTPException(status_code=503, detail="Data not loaded yet")
    
    skus = df['sku_id'].unique().tolist()
    return {
        "total_skus": len(skus),
        "skus": sorted(skus)
    }

# Startup event - load data
@app.on_event("startup")
async def startup_event():
    global df
    logger.info("🚀 Starting Data MCP Server...")
    try:
        df = load_data_from_s3()
        logger.info("✅ Data MCP Server ready!")
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
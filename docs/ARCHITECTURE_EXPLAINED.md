# FMCG Demand Intelligence Platform
## Complete Architecture & Business Flow Guide

---

## TABLE OF CONTENTS
1. System Overview
2. Data Flow Scenarios
3. Component Responsibilities
4. CI/CD Pipeline Explained
5. Real Business Use Cases
6. Scaling Strategy

---

## 1. SYSTEM OVERVIEW

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER LAYER (Business Users)                  │
│  • Demand Planners: "What if we drop price by 15%?"             │
│  • Sales Teams: "Why is SKU_102 forecast up 40%?"               │
│  • Supply Chain: "Will we have stockouts in Mumbai DC?"          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Entry Point)                      │
│  • Rate limiting (1000 req/min per user)                         │
│  • Authentication (JWT tokens)                                   │
│  • Routes requests to appropriate MCP server                     │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT (LangGraph + Claude)             │
│  • Understands user query in natural language                    │
│  • Routes to correct MCP servers                                 │
│  • Combines results from multiple agents                         │
│  • Returns business-friendly response                            │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   DATA MCP   │  MODEL MCP   │ SCENARIO MCP │ SUPPLY CHAIN │
│              │              │              │     MCP      │
│ • Fetch      │ • Train      │ • Simulate   │ • Optimize   │
│   sales data │   models     │   what-if    │   inventory  │
│ • Clean      │ • Predict    │ • Price      │ • Calculate  │
│   outliers   │ • Compare    │   elasticity │   safety     │
│ • Feature    │ • Store in   │ • Promo      │   stock      │
│   engineer   │   MLflow     │   impact     │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Cloud)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL   │  │ DynamoDB     │  │   S3 (Data   │       │
│  │              │  │              │  │    Lake)     │       │
│  │ • Sales      │  │ • Usage      │  │              │       │
│  │   history    │  │   metrics    │  │ • Raw data   │       │
│  │ • Forecasts  │  │ • Events     │  │ • Models     │       │
│  │ • Scenarios  │  │ • Alerts     │  │ • Logs       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐                                            │
│  │ Redis Cache  │                                            │
│  │ • Forecasts  │                                            │
│  │ • Sessions   │                                            │
│  └──────────────┘                                            │
└──────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────┐
│              STREAMING LAYER (Real-Time Events)               │
│  Kinesis Data Streams → Lambda → DynamoDB + S3              │
│  • POS sales every 30 min → Trigger forecast update         │
│  • Weather anomaly detected → Alert supply chain            │
│  • Model drift detected → Trigger retraining                │
└──────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────┐
│            CI/CD PIPELINE (GitHub Actions)                    │
│  Code push → Test → Build Docker → Push ECR → K8s deploy    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. DATA FLOW SCENARIOS

### SCENARIO 1: Monthly Sales Data Upload + Full System Run

**Business Context:**
"It's the 1st of June. We received May's sales data from all stores. We need to retrain our forecasting models, generate new forecasts for Q3, and alert supply chain about stockout risks."

**Step-by-Step Execution:**

#### Step 1: Data Ingestion
```
Monthly Sales File (May_2026_sales.csv)
    ├─ 500 SKUs × 1000 stores × 31 days = 15.5M records
    ├─ Format: [sku_id, store_id, date, sales_units, revenue]
    ├─ Uploaded to S3: s3://fmcg-bucket/uploads/May_2026_sales.csv
    │
    └─> Data MCP Server receives upload
        ├─ Validates schema
        ├─ Detects outliers (e.g., "SKU_45 sold 10x normal on May 15")
        │  → Flag: Possible promotional event
        ├─ Merges with historical data (Jan-Apr)
        ├─ Stores cleaned data in PostgreSQL
        └─ Triggers downstream processes (automatic)
```

**Example:** If May data shows SKU_102 (beverage) had 40% higher sales on May 25-26 (holiday weekend), the data MCP:
- Detects spike
- Tags it as "seasonal_holiday"
- Passes to Model MCP for context

#### Step 2: Model Retraining
```
Model MCP Server triggered
    ├─ Fetches data from Data MCP for all 500 SKUs
    ├─ Splits: Train (Jan-Apr), Test (May)
    │
    ├─ For each SKU, trains 3 models in parallel:
    │  ├─ SARIMA (statistical baseline)
    │  │  └─ MAPE on test set: 16.2%
    │  ├─ XGBoost (ML with features: lag_7, lag_14, promo_flag)
    │  │  └─ MAPE on test set: 11.8% ✓ BEST
    │  └─ ETS (exponential smoothing)
    │     └─ MAPE on test set: 14.5%
    │
    ├─ Selects XGBoost for each SKU (lowest MAPE)
    ├─ Logs in MLflow:
    │  └─ Model name: fmcg_xgboost_v2_2026Q2
    │     Metrics: {sku_001: {mape: 11.8, rmse: 45.2, ...}, ...}
    │     Training date: 2026-06-01
    │     Data cutoff: 2026-05-31
    │
    └─ Stores model artifacts in S3 + MLflow
       └─ s3://fmcg-bucket/models/fmcg_xgboost_v2_2026Q2/
```

**Example:** For SKU_102 (beverage):
- Historical pattern: 30% higher demand in summer
- May data confirms: May 25-26 spike aligned with holiday
- XGBoost captures this via lag_7 feature (last week's demand)
- Q3 forecast: June +12%, July +28%, Aug +35% vs baseline

#### Step 3: Generate Forecasts for Q3
```
Forecasting Agent processes all 500 SKUs
    ├─ Input: Trained XGBoost models, exogenous features
    ├─ For each SKU, generates 92-day forecast (Jun, Jul, Aug)
    │
    └─> Example: SKU_102
        Date         Forecast  Lower_Bound  Upper_Bound  Confidence
        2026-06-01   1200      1050         1350         0.95
        2026-06-02   1280      1120         1440         0.95
        ...
        2026-08-31   1950      1680         2220         0.95
        
        └─> Stored in PostgreSQL forecasts table
            └─> Cached in Redis for fast retrieval
```

#### Step 4: Scenario Simulation (Supply Chain)
```
Supply Chain Agent runs overnight:
    ├─ Question: "Given Q3 forecasts, will we have stockouts?"
    │
    ├─ For each DC (Mumbai, Delhi, Bangalore, etc.):
    │  ├─ Current inventory: 50,000 units SKU_102
    │  ├─ Replenishment lead time: 14 days
    │  ├─ Q3 demand forecast: 1200→1950 units/day
    │  ├─ Safety stock calculation:
    │  │  └─ z-score * std_dev(forecast_error)
    │  │  └─ z=1.96 (95% service level) * 45 units = 88 units
    │  ├─ Checks: 50,000 > (92 days × 1950 units) - OK for 25 days
    │  │
    │  └─ ALERT: DC_Mumbai will run out July 15
    │     └─ Recommendation: Increase replenishment from 2000 to 3000 units/week
    │
    └─> Stores alerts in DynamoDB
        └─> Triggers Slack notification to Supply Chain team
```

**Example Alert:**
```
🚨 STOCKOUT RISK ALERT

SKU: SKU_102 (Beverage - Orange Juice)
DC: Mumbai
Risk Date: 2026-07-15

Current Inventory: 50,000 units
Q3 Avg Daily Demand: 1,850 units
Days of stock remaining: 27 days

Recommendation:
├─ Increase weekly replenishment from 2,000 → 3,000 units
├─ Start ordering from June 10 (14-day lead time)
└─ Expected cost impact: ₹2.5L additional holding cost

Confidence: 92% (based on historical forecast accuracy)
```

#### Step 5: Commit to Git & Deploy
```
Summary of changes:
├─ data/fmcg_sales_cleaned.csv (15.5M rows → processed)
├─ models/fmcg_xgboost_v2_2026Q2/ (new trained model)
├─ forecasts/Q3_2026_forecasts.csv (92 days × 500 SKUs)
├─ alerts/stockout_risks_Q3.json (12 alerts generated)
│
└─> Git commit: "Monthly update: May data + Q3 forecasts + stockout alerts"
    └─> Triggers CI/CD pipeline
```

---

### SCENARIO 2: Code Update - Adding New Feature "Weather Integration"

**Business Context:**
"We realize beverage demand is strongly correlated with temperature. We want to add a weather API integration to improve forecast accuracy."

**Developer adds new feature:**

```python
# New file: mcp-servers/signals/weather.py
def fetch_weather_for_region(region, date_range):
    """Fetch daily max temp from OpenWeatherMap"""
    return [
        {date: "2026-06-01", temp_max: 42, humidity: 65},
        {date: "2026-06-02", temp_max: 41, humidity: 68},
        ...
    ]
```

**Git workflow:**

```
1. Create feature branch
   git checkout -b feature/weather-integration

2. Add code + tests
   ├─ mcp-servers/signals/weather.py
   ├─ mcp-servers/signals/Dockerfile (NEW - weather service container)
   └─ tests/test_weather.py

3. Test locally
   docker build -t weather-mcp:latest mcp-servers/signals/
   docker run -p 8004:8001 weather-mcp:latest
   curl http://localhost:8004/fetch_weather?region=Mumbai&date=2026-06-01

4. Commit & push
   git add .
   git commit -m "Feature: Add weather integration for beverage demand forecasting"
   git push origin feature/weather-integration

5. Create Pull Request on GitHub
   ├─ Triggers automated CI/CD:
   │  ├─ Run pytest (unit tests must pass)
   │  ├─ Build Docker image: weather-mcp:latest
   │  ├─ Push to ECR: 489741402725.dkr.ecr.ap-south-1.amazonaws.com/weather-mcp:latest
   │  └─ Deploy to staging K8s cluster
   │     └─ Test endpoint: staging-weather-mcp.fmcg.internal
   │
   ├─ Code review: Team reviews changes
   ├─ Approval: Merged to main

6. Production deployment (automatic)
   ├─ Git webhook triggers deployment
   ├─ New K8s pod spawned with weather-mcp:latest image
   ├─ Old pod gracefully shutdown (0 downtime)
   ├─ Load balancer routes traffic to new pod
   └─ Forecast models NOW use weather data
      └─ Accuracy for beverages: 14.5% → 9.8% MAPE ✓
```

**Impact:**

Before:
- XGBoost forecast for SKU_102 (beverage) on June 1: 1200 units
- Actual: 1450 units (19% error due to unexpected heat wave)

After:
- Weather feature: "temp_max = 42°C"
- Adjusted forecast: 1420 units
- Actual: 1450 units (2% error) ✓

---

### SCENARIO 3: Bug Fix - Model Serving Wrong Forecast

**Business Context:**
"Production issue: Forecasts for SKU_555 are consistently 30% too high. Demand planners are over-ordering."

**Root cause analysis:**

```
1. Alert detected
   CloudWatch alarm: ForecastMAPE_SKU555 > 25%
   └─> Triggers PagerDuty alert to data science team

2. Investigation
   git log --oneline | grep SKU_555
   └─> Found: Model v2.1 is being used (outdated)
   
3. Check MLflow
   Model v2.3 (latest) has MAPE 11% on test set
   Model v2.1 (deployed) has MAPE 8% on old test set
   └─> v2.1 overfits to old data, fails on recent May data

4. Hotfix deployed
   git checkout -b hotfix/sku555-model-rollback
   ├─ Update model registry: Set v2.3 as production
   ├─ Commit: "Hotfix: Rollback SKU_555 model v2.1 → v2.3"
   ├─ Push to main
   └─> CI/CD automatically:
       ├─ Builds new Docker image with v2.3
       ├─ Pushes to ECR
       ├─ Deploys to K8s
       └─ Forecast regenerated
          └─ SKU_555 forecast Jun 1: 1800 → 1200 units ✓

5. Monitoring
   ├─ CloudWatch tracks MAPE for SKU_555
   ├─ Day 1: 11.2% (within normal range)
   ├─ Day 2: 10.8%
   └─ Day 3: 11.1% ✓ FIXED
```

---

## 3. COMPONENT RESPONSIBILITIES

### 3.1 Data MCP Server
**File location:** `mcp-servers/data/main.py`

**Responsibilities:**
- Fetch sales data from S3/PostgreSQL
- Clean outliers (IQR method)
- Feature engineering (lag features, seasonality)
- Return structured data to other agents

**Example triggers:**
```
1. Monthly sales upload → Validate & clean
2. Forecast request → Return last 365 days of history
3. Promo campaign → Fetch historical promo impact data
```

**Docker image update needed when:**
- SQL query logic changes
- Feature engineering algorithm changes
- New data source added (e.g., new point-of-sale system)
```bash
git add mcp-servers/data/main.py
git commit -m "Update: Add new data source - ecommerce sales"
git push origin main
# CI/CD automatically builds new Docker image
```

### 3.2 Model MCP Server
**File location:** `mcp-servers/model/main.py`

**Responsibilities:**
- Train models (SARIMA, XGBoost, ETS)
- Model selection (MAPE-based)
- Register in MLflow
- Generate predictions

**Example triggers:**
```
1. Monthly data available → Retrain all models
2. Forecast request → Use best model for SKU
3. Model drift detected → Trigger automatic retraining
```

**Docker image + requirements update needed when:**
- XGBoost version changes
- New hyperparameter tuning logic
- MLflow integration updates
```bash
# Update library version
echo "xgboost==2.1.0" >> requirements.txt
git add requirements.txt mcp-servers/model/main.py
git commit -m "Update: XGBoost 2.0.3 → 2.1.0 (better GPU support)"
git push origin main
# Docker image rebuilt with new XGBoost
```

### 3.3 Scenario MCP Server
**File location:** `mcp-servers/scenario/main.py`

**Responsibilities:**
- Price elasticity modeling
- Promotional lift calculation
- What-if scenario simulation
- Cannibalization effects

**Example triggers:**
```
1. Price change request: "Drop SKU_102 by 15%" → Forecast impact
2. Promo planning: "Buy 1 Get 1 on beverages" → Revenue impact
3. Competitor action: "Competitor launched similar product" → Market share
```

**Docker image update needed when:**
- Elasticity curve fitting changes
- New promo types added
- Cannibalization model updated

### 3.4 Supply Chain MCP Server
**File location:** `mcp-servers/supply_chain/main.py`

**Responsibilities:**
- Inventory optimization
- Safety stock calculation
- Stockout risk simulation
- Multi-echelon allocation

**Example triggers:**
```
1. New forecasts generated → Calculate optimal safety stock
2. Capacity constraint: "DC_Mumbai max 100K units" → Optimize allocation
3. Service level change: "Need 98% SL" → Increase safety stock
```

**Docker image update needed when:**
- OR solver changed (PuLP → OR-Tools)
- Safety stock formula changes (z-score method → simulation)
- New DC added (network reconfiguration)

---

## 4. CI/CD PIPELINE FLOW

### Trigger: Code Push to Main

```
Developer pushes code
    ↓
git push origin main
    ↓
GitHub receives push
    ↓
Webhook triggers GitHub Actions
    ↓
.github/workflows/deploy.yml starts
    │
    ├─ Step 1: Checkout code
    ├─ Step 2: Configure AWS credentials
    ├─ Step 3: Login to ECR
    ├─ Step 4: Build Docker images
    │  ├─ Data MCP: docker build -t ECR/data-mcp:latest mcp-servers/data/
    │  ├─ Model MCP: docker build -t ECR/model-mcp:latest mcp-servers/model/
    │  ├─ Scenario MCP: docker build -t ECR/scenario-mcp:latest mcp-servers/scenario/
    │  └─ Supply Chain MCP: docker build -t ECR/supply-mcp:latest mcp-servers/supply/
    │
    ├─ Step 5: Push to ECR
    │  └─ docker push ECR/data-mcp:latest
    │  └─ docker push ECR/model-mcp:latest
    │  └─ docker push ECR/scenario-mcp:latest
    │  └─ docker push ECR/supply-mcp:latest
    │
    └─ Step 6: Deploy to Kubernetes
       ├─ kubectl set image deployment/data-mcp data-mcp=ECR/data-mcp:latest
       ├─ kubectl set image deployment/model-mcp model-mcp=ECR/model-mcp:latest
       ├─ kubectl set image deployment/scenario-mcp scenario-mcp=ECR/scenario-mcp:latest
       └─ kubectl set image deployment/supply-mcp supply-mcp=ECR/supply-mcp:latest
           └─ K8s rolling update (old pods gradual shutdown, new pods startup)
               └─ 0 downtime deployment ✓
```

### Failure handling
```
If any step fails (e.g., build fails, Docker push fails):
    ├─ GitHub Actions stops execution
    ├─ Slack notification sent to #data-alerts
    ├─ PagerDuty triggered if production
    ├─ Previous deployment remains active (rollback automatic)
    └─ Developer fixes issue, git push again
```

---

## 5. REAL BUSINESS USE CASES & SYSTEM RESPONSE

### Use Case 1: Demand Planner Query
**User:** "What's the forecast for beverages in Mumbai for next month if we run a 20% discount?"

**Execution flow:**

```
User input (natural language)
    ↓
Orchestrator Agent parses intent
    ├─ Entity extraction: category=beverage, region=Mumbai, discount=20%
    ├─ Intent: Scenario simulation
    │
    └─> Routes to Scenario Agent
        │
        ├─ Fetches baseline forecast from Model MCP
        │  └─ "Baseline June forecast for beverages in Mumbai: 50K units"
        │
        ├─ Applies price elasticity
        │  ├─ Historical elasticity for beverages: -1.2 (1% price drop → 1.2% demand increase)
        │  ├─ 20% discount → Expected demand lift: 20% × 1.2 = 24% increase
        │  └─ Adjusted forecast: 50K × 1.24 = 62K units
        │
        ├─ Checks cannibalization
        │  ├─ Other beverage SKUs in Mumbai: 8 SKUs
        │  ├─ Estimated cannibalization: 8% (some demand shift from premium to discount)
        │  └─ Net increase: 24% - 8% = 16%
        │  └─ Final forecast: 50K × 1.16 = 58K units
        │
        ├─ Passes to Supply Chain Agent
        │  ├─ Current DC inventory: 55K units
        │  ├─ Replenishment lead time: 14 days
        │  ├─ With 58K units demand, will run out on day 25
        │  └─ Recommendation: Increase replenishment order by 5K units
        │
        └─> Orchestrator synthesizes response (Claude NL):
            "Yes, 20% discount will increase beverage demand to 58K units
             in Mumbai for June (+16% vs baseline). Current inventory of 55K
             will cover 25 days. Recommend increasing replenishment order by
             5K units, starting June 10 to account for 14-day lead time.
             Estimated additional holding cost: ₹1.2L."
```

**Data involved:**
- Forecasts table (PostgreSQL): Latest baseline forecast
- Elasticity curves (S3): Historical price response data
- Inventory snapshot (DynamoDB): Current DC levels
- Lead time config (PostgreSQL): Replenishment parameters

---

### Use Case 2: Supply Chain Alert
**Trigger:** Kinesis stream detects weather anomaly

```
Weather Service detects:
    └─ Temperature spike: 45°C in Delhi (5°C above seasonal average)
       └─ Historical correlation: +5°C → +18% beverage demand
    
    └─> Streams to Kinesis
        └─> Lambda triggers (serverless function)
            └─> Exogenous Monitor Agent processes
                ├─ Checks forecasts for beverage SKUs in Delhi
                ├─ Current forecast for next 7 days: 80K units
                ├─ Adjusted forecast (weather spike): 80K × 1.18 = 94K units
                ├─ Current DC inventory: 85K units
                ├─ Shortfall: 9K units
                │
                └─> Stores alert in DynamoDB
                    └─> Triggers Slack notification:
                        "🌡️ WEATHER ANOMALY ALERT
                         Location: Delhi
                         Temp spike: +5°C detected
                         Beverage demand forecast: +18% (80K→94K units)
                         Current inventory: 85K (SHORTFALL: 9K units)
                         Action: Emergency replenishment recommended"
```

---

### Use Case 3: Model Quality Degradation
**Trigger:** Automated daily model quality check

```
Day 1 (Monday):
    └─ Model accuracy check (CloudWatch batch job)
        ├─ Compare forecast vs actual for last 30 days
        ├─ MAPE overall: 12.1% (normal range: 10-15%)
        └─ Status: ✓ OK

Day 2-5 (Tue-Fri):
    └─ MAPE trending up: 12.8% → 13.5% → 14.2% → 15.1%
        └─ CloudWatch alarm triggers (MAPE > 15%)

Day 6 (Saturday):
    └─ Retraining triggered automatically
        ├─ Fetches latest data (past 60 days)
        ├─ Retrains XGBoost + SARIMA + ETS
        ├─ Selects best model (lowest MAPE on validation set)
        ├─ Registers new version in MLflow
        ├─ Updates Docker image with new model
        ├─ Deploys to production
        └─ Forecast regenerated with new model
            └─ New MAPE: 11.8% ✓ RECOVERED
                └─ Slack notification: "Model auto-retraining completed. Accuracy recovered to 11.8%"
```

---

## 6. SCALING STRATEGY

### Current (Week 1-2): Single Region, Single Pod Per Service
```
Architecture:
├─ 1 Data MCP pod (handling all data requests)
├─ 1 Model MCP pod (training + serving)
├─ 1 Scenario MCP pod
├─ 1 Supply Chain MCP pod
└─ Capacity: ~100 concurrent users

Monthly forecast run: 2-3 hours
```

### Week 3-4: Multiple Pods, Auto-Scaling
```
Architecture:
├─ Data MCP: 3 pods (data retrieval is read-heavy, easily parallelizable)
├─ Model MCP: 2 pods (prediction is fast, training is offline)
├─ Scenario MCP: 2 pods (simulation is CPU-intensive)
├─ Supply Chain MCP: 2 pods
└─ Capacity: ~1000 concurrent users

Load balancer distributes:
├─ Request 1 → Pod 1 (response in 200ms)
├─ Request 2 → Pod 2 (parallel, response in 200ms)
├─ Request 3 → Pod 3 (parallel, response in 200ms)
└─ vs. single pod → 3 sequential requests = 600ms total

Auto-scaling rule:
    IF CPU utilization > 70% for 2 minutes
        THEN spin up new pod
    IF CPU utilization < 20% for 10 minutes
        THEN delete pod
```

### Month 2-3: Multi-Region Deployment
```
Architecture:
├─ Region 1 (ap-south-1, India):
│  ├─ Data MCP: 5 pods
│  ├─ Model MCP: 3 pods
│  ├─ Scenario MCP: 3 pods
│  └─ RDS Primary (writes), S3
│
├─ Region 2 (ap-southeast-1, Southeast Asia):
│  ├─ Data MCP: 3 pods (read replicas)
│  ├─ Model MCP: 2 pods (read-only)
│  └─ RDS Read replica
│
└─ CDN (CloudFront):
    └─ Cache forecast responses globally
        └─ 99% cache hit rate for repeated queries

Capacity: ~10,000 concurrent users
Monthly forecast: 30 minutes (10x parallelization)
```

### When to Upgrade Components

**Data MCP:**
- Upgrade when: New data source added (e.g., ecommerce POS)
- Action: Update data schema, retrain feature engineering pipeline
- Example:
  ```bash
  git add mcp-servers/data/main.py requirements.txt
  git commit -m "Feature: Add ecommerce sales integration"
  git push origin main
  # CI/CD auto-deploys
  ```

**Model MCP:**
- Upgrade when: New model type added, hyperparameter tuning changes, MLflow schema changes
- Action: Retrain all models, validate accuracy
- Example:
  ```bash
  echo "catboost==1.2.0" >> requirements.txt  # New model type
  git add requirements.txt mcp-servers/model/main.py
  git commit -m "Feature: Add CatBoost for high-cardinality features"
  git push origin main
  # Models retrained, old XGBoost version remains as fallback
  ```

**Scenario MCP:**
- Upgrade when: New promo types, elasticity model changes, cannibalization rules update
- Example:
  ```bash
  git add mcp-servers/scenario/elasticity_curves.py
  git commit -m "Update: Q2 elasticity curves from actual campaign data"
  git push origin main
  # New scenarios use updated curves, 20% higher accuracy
  ```

**Supply Chain MCP:**
- Upgrade when: New DC added, constraint changes, optimization algorithm changes
- Example:
  ```bash
  git add mcp-servers/supply/constraints.json
  git commit -m "Update: Add new DC Pune with 50K capacity"
  git push origin main
  # Allocation optimization re-runs across 5 DCs instead of 4
  ```

---

## SUMMARY TABLE

| Component | Trigger | Action | Impact | Deployment |
|-----------|---------|--------|--------|-----------|
| Data MCP | New sales data uploaded | Validate, clean, feature engineer | Better forecast input | Auto (10 min) |
| Model MCP | Monthly/weekly new data | Retrain models | Lower MAPE | Auto (1-2 hr) |
| Scenario | Planning team needs simulation | Run what-if analysis | Business decision support | Real-time (seconds) |
| Supply Chain | New forecasts generated | Calculate safety stock, optimize allocation | Operational planning | Auto (5 min) |
| CI/CD | Code pushed to main | Build Docker, push ECR, deploy K8s | 0-downtime updates | Auto (5-10 min) |

---

## KEY BUSINESS METRICS TRACKED

```
Production Metrics:
├─ Forecast Accuracy (MAPE): Target <15% per SKU
├─ Service Level (fill rate): Target >95%
├─ Stockout incidents: Target <1% of SKUs/month
├─ Forecast update latency: Target <5 min for new data
├─ System uptime: Target >99.9%
└─ Cost per forecast: Target <₹1 per SKU/month

Quality Metrics:
├─ Model drift detection: Automated (MAPE >15%)
├─ Auto-retraining accuracy: Monitor improvement
├─ Data quality: Outlier detection & flagging
└─ Scenario accuracy: Compare predicted vs actual promo lift
```

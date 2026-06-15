-- ============================================================================
-- FMCG DEMAND INTELLIGENCE PLATFORM
-- PostgreSQL Multi-Tenant Schema
-- Hierarchy: Tenant → Project → Experiment → Params
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. MASTER TABLES (Tenants & Users)
-- ============================================================================

CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100),
    num_skus INTEGER,
    num_stores INTEGER,
    status VARCHAR(20) DEFAULT 'active',  -- active, trialing, paused
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'analyst',  -- admin, demand_planner, supply_chain, analyst
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- ============================================================================
-- 2. PROJECT MANAGEMENT
-- ============================================================================

CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(user_id),
    status VARCHAR(20) DEFAULT 'active',  -- active, archived, paused
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, project_name)
);

-- ============================================================================
-- 3. EXPERIMENTS (Variants within a project)
-- ============================================================================

CREATE TABLE experiments (
    experiment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    experiment_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, running, completed, failed
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(project_id, experiment_name)
);

-- ============================================================================
-- 4. EXPERIMENT PARAMETERS & CONFIGURATION
-- ============================================================================

CREATE TABLE experiment_params (
    param_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    
    -- Model selection (can be multiple for ensemble)
    models_selected JSONB NOT NULL,  -- {"xgboost": true, "sarima": true, "prophet": false}
    ensemble_enabled BOOLEAN DEFAULT FALSE,
    
    -- Time windows
    train_window_days INTEGER NOT NULL DEFAULT 90,
    test_window_days INTEGER NOT NULL DEFAULT 30,
    forecast_horizon_days INTEGER NOT NULL DEFAULT 30,
    
    -- Geography, Product, Time (GPT) Levels
    geography_level VARCHAR(50) NOT NULL DEFAULT 'regional',  -- national, regional, store
    product_level VARCHAR(50) NOT NULL DEFAULT 'sku',        -- category, brand, sku
    time_level VARCHAR(50) NOT NULL DEFAULT 'daily',         -- daily, weekly, monthly
    
    -- Advanced parameters
    outlier_detection_method VARCHAR(50) DEFAULT 'iqr',  -- iqr, zscore, isolation_forest
    outlier_threshold DECIMAL(5, 2) DEFAULT 3.0,
    
    -- Model-specific hyperparameters
    xgboost_max_depth INTEGER,
    xgboost_learning_rate DECIMAL(5, 3),
    sarima_order JSONB,  -- {"p": 1, "d": 1, "q": 1}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE model_configs (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    
    model_type VARCHAR(50) NOT NULL,  -- xgboost, sarima, prophet, ensemble
    model_version VARCHAR(20),
    mlflow_run_id VARCHAR(255),
    
    -- Model performance metrics
    train_mape DECIMAL(5, 2),
    test_mape DECIMAL(5, 2),
    train_rmse DECIMAL(10, 2),
    test_rmse DECIMAL(10, 2),
    
    -- Model artifact location
    artifact_path VARCHAR(255),  -- s3 path or local path
    
    status VARCHAR(20) DEFAULT 'training',  -- training, trained, deployed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. DATA MANAGEMENT (Schema Mapping & Uploads)
-- ============================================================================

CREATE TABLE schema_mappings (
    mapping_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    
    upload_file_name VARCHAR(255),
    
    -- Mapping from user's columns to standard schema
    sku_column VARCHAR(255) NOT NULL,        -- user's column name for SKU
    date_column VARCHAR(255) NOT NULL,       -- user's column name for Date
    sales_units_column VARCHAR(255) NOT NULL,  -- user's column name for Sales Units
    region_column VARCHAR(255),              -- optional
    channel_column VARCHAR(255),             -- optional
    
    mapping_json JSONB,  -- Full mapping as JSON
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_uploads (
    upload_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(project_id),
    
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),  -- csv, xlsx, parquet
    
    row_count INTEGER,
    column_count INTEGER,
    
    mapping_id UUID REFERENCES schema_mappings(mapping_id),
    
    status VARCHAR(20) DEFAULT 'processing',  -- processing, validated, error
    error_message TEXT,
    
    uploaded_by UUID REFERENCES users(user_id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- ============================================================================
-- 6. SALES DATA (Tenant-specific table, partitioned by tenant_id)
-- ============================================================================

CREATE TABLE sales_history (
    id BIGSERIAL,
    tenant_id UUID NOT NULL,
    sku_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    sales_units INTEGER NOT NULL,
    sales_revenue DECIMAL(10, 2),
    
    -- Optional fields
    region VARCHAR(100),
    channel VARCHAR(50),
    store_id VARCHAR(50),
    
    -- Metadata
    source_upload_id UUID REFERENCES tenant_uploads(upload_id),
    is_outlier BOOLEAN DEFAULT FALSE,
    outlier_reason VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (tenant_id, id)
) PARTITION BY HASH (tenant_id);

-- Create 10 partitions for better performance
CREATE TABLE sales_history_0 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 0);
CREATE TABLE sales_history_1 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 1);
CREATE TABLE sales_history_2 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 2);
CREATE TABLE sales_history_3 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 3);
CREATE TABLE sales_history_4 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 4);
CREATE TABLE sales_history_5 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 5);
CREATE TABLE sales_history_6 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 6);
CREATE TABLE sales_history_7 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 7);
CREATE TABLE sales_history_8 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 8);
CREATE TABLE sales_history_9 PARTITION OF sales_history FOR VALUES WITH (MODULUS 10, REMAINDER 9);

-- Indexes for fast queries
CREATE INDEX idx_sales_sku_date ON sales_history(sku_id, date);
CREATE INDEX idx_sales_tenant ON sales_history(tenant_id);
CREATE INDEX idx_sales_region ON sales_history(region);

-- ============================================================================
-- 7. FORECAST RESULTS (Single table, filtered by experiment_id)
-- ============================================================================

CREATE TABLE forecast_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
    
    sku_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    
    -- Forecast values
    forecast_value DECIMAL(10, 2) NOT NULL,
    lower_bound DECIMAL(10, 2),
    upper_bound DECIMAL(10, 2),
    confidence_level DECIMAL(3, 2),
    
    -- Model info
    model_type VARCHAR(50),  -- xgboost, sarima, prophet, ensemble
    model_version VARCHAR(20),
    
    -- Accuracy metrics
    mape DECIMAL(5, 2),
    rmse DECIMAL(10, 2),
    mae DECIMAL(10, 2),
    
    -- Optional: Actual value (after date passes)
    actual_value DECIMAL(10, 2),
    actual_mape DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX idx_forecast_exp ON forecast_results(experiment_id);
CREATE INDEX idx_forecast_tenant_project ON forecast_results(tenant_id, project_id);
CREATE INDEX idx_forecast_sku_date ON forecast_results(sku_id, date);

-- ============================================================================
-- 8. SCENARIOS & WHAT-IF ANALYSIS
-- ============================================================================

CREATE TABLE scenarios (
    scenario_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    
    scenario_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scenario parameters
    scenario_type VARCHAR(50),  -- price_change, promo, competitor, weather
    
    price_change_pct DECIMAL(5, 2),        -- e.g., -15 for 15% discount
    promo_type VARCHAR(50),                -- BOGO, discount, bundle
    promo_discount_pct DECIMAL(5, 2),
    
    affected_skus JSONB,  -- ["SKU_001", "SKU_002"] or null for all
    affected_regions JSONB,
    
    start_date DATE,
    end_date DATE,
    
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scenario_results (
    scenario_result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
    
    sku_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    
    baseline_forecast DECIMAL(10, 2),
    scenario_forecast DECIMAL(10, 2),
    lift_pct DECIMAL(5, 2),
    
    -- Business impact
    revenue_impact DECIMAL(15, 2),
    margin_impact DECIMAL(15, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. ALERTS & MONITORING
-- ============================================================================

CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(project_id),
    
    alert_type VARCHAR(50) NOT NULL,  -- stockout_risk, model_drift, data_quality, accuracy_degradation
    severity VARCHAR(20),              -- high, medium, low
    
    sku_id VARCHAR(50),
    region VARCHAR(100),
    
    message TEXT NOT NULL,
    recommended_action TEXT,
    
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(user_id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_tenant_unresolved ON alerts(tenant_id) WHERE is_resolved = FALSE;

-- ============================================================================
-- 10. AUDIT LOG (For compliance & debugging)
-- ============================================================================

CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    
    action VARCHAR(100) NOT NULL,  -- upload_data, create_experiment, run_forecast, etc.
    resource_type VARCHAR(50),     -- experiment, project, forecast, etc.
    resource_id VARCHAR(255),
    
    details JSONB,  -- JSON details of action
    
    ip_address VARCHAR(50),
    status VARCHAR(20),  -- success, failure
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);

-- ============================================================================
-- 11. VIEWS (For common queries)
-- ============================================================================

-- Latest forecasts per experiment
CREATE VIEW v_latest_forecasts AS
SELECT 
    fr.experiment_id,
    fr.tenant_id,
    fr.sku_id,
    fr.date,
    fr.forecast_value,
    fr.mape,
    mc.model_type,
    ROW_NUMBER() OVER (PARTITION BY fr.experiment_id, fr.sku_id ORDER BY fr.created_at DESC) as rn
FROM forecast_results fr
LEFT JOIN model_configs mc ON fr.experiment_id = mc.experiment_id AND fr.model_type = mc.model_type
WHERE rn = 1;

-- Experiment summary
CREATE VIEW v_experiment_summary AS
SELECT 
    e.experiment_id,
    e.project_id,
    e.tenant_id,
    e.experiment_name,
    COUNT(DISTINCT fr.sku_id) as num_skus_forecasted,
    AVG(fr.mape) as avg_mape,
    MIN(fr.created_at) as first_forecast,
    MAX(fr.created_at) as latest_forecast,
    e.status
FROM experiments e
LEFT JOIN forecast_results fr ON e.experiment_id = fr.experiment_id
GROUP BY e.experiment_id, e.project_id, e.tenant_id, e.experiment_name, e.status;

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) for Multi-Tenancy
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON sales_history
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_forecasts ON forecast_results
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_alerts ON alerts
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_audit ON audit_log
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ============================================================================
-- INITIALIZATION: Create Admin Tenant & User for Testing
-- ============================================================================

-- Insert test tenant
INSERT INTO tenants (company_name, industry, num_skus, num_stores, status)
VALUES ('Test Company', 'FMCG', 50, 100, 'active')
ON CONFLICT DO NOTHING;

-- Note: Password hashing should be done in application code
-- This is just a placeholder
INSERT INTO users (tenant_id, email, password_hash, full_name, role, status)
SELECT tenant_id, 'admin@test.com', 'hashed_password_here', 'Test Admin', 'admin', 'active'
FROM tenants WHERE company_name = 'Test Company'
ON CONFLICT DO NOTHING;
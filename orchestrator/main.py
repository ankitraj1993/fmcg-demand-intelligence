"""
FMCG Demand Intelligence Platform - FastAPI Backend
Multi-tenant architecture with Tenant → Project → Experiment → Params hierarchy
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, Numeric, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import os
from dotenv import load_dotenv
import uuid
from passlib.context import CryptContext
import pandas as pd
import io

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
API_URL = os.getenv("API_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database setup
engine = create_engine(DATABASE_URL, echo=os.getenv("SQLALCHEMY_ECHO", "False") == "True")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI app
app = FastAPI(title="FMCG Demand Intelligence API", version="0.1.0")

# CORS Configuration (NOT wildcard)
ALLOWED_ORIGINS = [
    API_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================================================
# PYDANTIC MODELS (Request/Response)
# ============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    tenant_id: str
    user_id: str

class ProjectCreate(BaseModel):
    project_name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    project_id: str
    project_name: str
    description: Optional[str]
    created_at: datetime

class ExperimentCreate(BaseModel):
    experiment_name: str
    description: Optional[str] = None

class ExperimentParamsCreate(BaseModel):
    models_selected: dict  # {"xgboost": true, "sarima": true}
    train_window_days: int = 90
    test_window_days: int = 30
    forecast_horizon_days: int = 30
    geography_level: str = "regional"
    product_level: str = "sku"
    time_level: str = "daily"

class ExperimentResponse(BaseModel):
    experiment_id: str
    experiment_name: str
    status: str
    created_at: datetime

class SchemaMapping(BaseModel):
    sku_column: str
    date_column: str
    sales_units_column: str
    region_column: Optional[str] = None
    channel_column: Optional[str] = None

class ForecastResponse(BaseModel):
    result_id: str
    sku_id: str
    date: str
    forecast_value: float
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    mape: Optional[float]
    model_type: str

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = None, db: Session = Depends(get_db)) -> dict:
    """Extract user from JWT token"""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    # Remove "Bearer " prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    payload = decode_token(token)
    user_id = payload.get("user_id")
    tenant_id = payload.get("tenant_id")
    
    if not user_id or not tenant_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {"user_id": user_id, "tenant_id": tenant_id}

# ============================================================================
# DATABASE MODELS (SQLAlchemy - using raw SQL for simplicity)
# ============================================================================
# Note: In production, use proper ORM models. For alpha, we'll use raw SQL queries
# to interact with the schema we created.

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "FMCG Demand Intelligence API"}

# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@app.post("/auth/register", response_model=TokenResponse)
async def register(user: UserRegister, db: Session = Depends(get_db)):
    """Register new tenant and user"""
    
    # Check if tenant exists
    result = db.execute(
        "SELECT tenant_id FROM tenants WHERE company_name = %s",
        (user.company_name,)
    )
    existing_tenant = result.fetchone()
    
    if existing_tenant:
        raise HTTPException(status_code=400, detail="Company already registered")
    
    try:
        # Create tenant
        tenant_id = str(uuid.uuid4())
        db.execute(
            """INSERT INTO tenants (tenant_id, company_name, status)
               VALUES (%s, %s, 'active')""",
            (tenant_id, user.company_name)
        )
        
        # Create user
        user_id = str(uuid.uuid4())
        password_hash = get_password_hash(user.password)
        db.execute(
            """INSERT INTO users (user_id, tenant_id, email, password_hash, full_name, role, status)
               VALUES (%s, %s, %s, %s, %s, 'admin', 'active')""",
            (user_id, tenant_id, user.email, password_hash, user.full_name)
        )
        
        db.commit()
        
        # Create JWT token
        access_token = create_access_token(
            data={"user_id": user_id, "tenant_id": tenant_id, "email": user.email}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "tenant_id": tenant_id,
            "user_id": user_id
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    
    # Find user by email
    result = db.execute(
        "SELECT user_id, tenant_id, password_hash FROM users WHERE email = %s",
        (user.email,)
    )
    user_record = result.fetchone()
    
    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id, tenant_id, password_hash = user_record
    
    # Verify password
    if not verify_password(user.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    access_token = create_access_token(
        data={"user_id": user_id, "tenant_id": tenant_id, "email": user.email}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "tenant_id": tenant_id,
        "user_id": user_id
    }

# ============================================================================
# PROJECT ENDPOINTS
# ============================================================================

@app.post("/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new project"""
    
    try:
        project_id = str(uuid.uuid4())
        db.execute(
            """INSERT INTO projects (project_id, tenant_id, project_name, description, created_by)
               VALUES (%s, %s, %s, %s, %s)""",
            (project_id, current_user["tenant_id"], project.project_name, project.description, current_user["user_id"])
        )
        db.commit()
        
        return ProjectResponse(
            project_id=project_id,
            project_name=project.project_name,
            description=project.description,
            created_at=datetime.utcnow()
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all projects for tenant"""
    
    result = db.execute(
        "SELECT project_id, project_name, description, created_at FROM projects WHERE tenant_id = %s",
        (current_user["tenant_id"],)
    )
    projects = result.fetchall()
    
    return [
        ProjectResponse(
            project_id=p[0],
            project_name=p[1],
            description=p[2],
            created_at=p[3]
        )
        for p in projects
    ]

# ============================================================================
# EXPERIMENT ENDPOINTS
# ============================================================================

@app.post("/projects/{project_id}/experiments", response_model=ExperimentResponse)
async def create_experiment(
    project_id: str,
    experiment: ExperimentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new experiment in project"""
    
    try:
        experiment_id = str(uuid.uuid4())
        db.execute(
            """INSERT INTO experiments (experiment_id, project_id, tenant_id, experiment_name, description, status, created_by)
               VALUES (%s, %s, %s, %s, %s, 'draft', %s)""",
            (experiment_id, project_id, current_user["tenant_id"], experiment.experiment_name, experiment.description, current_user["user_id"])
        )
        db.commit()
        
        return ExperimentResponse(
            experiment_id=experiment_id,
            experiment_name=experiment.experiment_name,
            status="draft",
            created_at=datetime.utcnow()
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/experiments", response_model=List[ExperimentResponse])
async def list_experiments(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List experiments in project"""
    
    result = db.execute(
        "SELECT experiment_id, experiment_name, status, created_at FROM experiments WHERE project_id = %s AND tenant_id = %s",
        (project_id, current_user["tenant_id"])
    )
    experiments = result.fetchall()
    
    return [
        ExperimentResponse(
            experiment_id=e[0],
            experiment_name=e[1],
            status=e[2],
            created_at=e[3]
        )
        for e in experiments
    ]

# ============================================================================
# EXPERIMENT PARAMETERS ENDPOINT
# ============================================================================

@app.post("/experiments/{experiment_id}/params")
async def set_experiment_params(
    experiment_id: str,
    params: ExperimentParamsCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set parameters for experiment"""
    
    try:
        param_id = str(uuid.uuid4())
        db.execute(
            """INSERT INTO experiment_params 
               (param_id, experiment_id, tenant_id, models_selected, train_window_days, 
                test_window_days, forecast_horizon_days, geography_level, product_level, time_level)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (param_id, experiment_id, current_user["tenant_id"], str(params.models_selected),
             params.train_window_days, params.test_window_days, params.forecast_horizon_days,
             params.geography_level, params.product_level, params.time_level)
        )
        db.commit()
        
        return {"param_id": param_id, "status": "created"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# DATA UPLOAD ENDPOINT
# ============================================================================

@app.post("/upload")
async def upload_data(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    schema_mapping: str = Form(...),  # JSON string
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and ingest data with schema mapping"""
    
    import json
    
    try:
        # Parse schema mapping
        mapping = json.loads(schema_mapping)
        
        # Read file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validate required columns
        required_cols = [mapping.get("sku_column"), mapping.get("date_column"), mapping.get("sales_units_column")]
        if not all(col in df.columns for col in required_cols):
            raise ValueError("CSV columns don't match schema mapping")
        
        # Rename columns to standard format
        df = df.rename(columns={
            mapping.get("sku_column"): "sku_id",
            mapping.get("date_column"): "date",
            mapping.get("sales_units_column"): "sales_units"
        })
        
        # Insert schema mapping
        mapping_id = str(uuid.uuid4())
        db.execute(
            """INSERT INTO schema_mappings (mapping_id, tenant_id, upload_file_name, sku_column, date_column, sales_units_column)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (mapping_id, current_user["tenant_id"], file.filename, 
             mapping.get("sku_column"), mapping.get("date_column"), mapping.get("sales_units_column"))
        )
        
        # Insert upload record
        upload_id = str(uuid.uuid4())
        db.execute(
            """INSERT INTO tenant_uploads (upload_id, tenant_id, project_id, file_name, row_count, mapping_id, status)
               VALUES (%s, %s, %s, %s, %s, %s, 'validated')""",
            (upload_id, current_user["tenant_id"], project_id, file.filename, len(df), mapping_id)
        )
        
        # Insert sales data
        for _, row in df.iterrows():
            db.execute(
                """INSERT INTO sales_history (tenant_id, sku_id, date, sales_units, source_upload_id)
                   VALUES (%s, %s, %s, %s, %s)""",
                (current_user["tenant_id"], row["sku_id"], row["date"], int(row["sales_units"]), upload_id)
            )
        
        db.commit()
        
        return {"upload_id": upload_id, "rows_inserted": len(df), "status": "success"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# FORECAST ENDPOINTS
# ============================================================================

@app.post("/experiments/{experiment_id}/forecast")
async def trigger_forecast(
    experiment_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger forecast generation for experiment"""
    
    # In production, this would queue a job to Model MCP
    # For alpha, we'll just return success
    
    try:
        # Update experiment status
        db.execute(
            "UPDATE experiments SET status = 'running' WHERE experiment_id = %s",
            (experiment_id,)
        )
        db.commit()
        
        return {"experiment_id": experiment_id, "status": "queued", "message": "Forecast generation started"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/experiments/{experiment_id}/results", response_model=List[ForecastResponse])
async def get_forecast_results(
    experiment_id: str,
    sku_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get forecast results for experiment"""
    
    if sku_id:
        result = db.execute(
            """SELECT result_id, sku_id, date, forecast_value, lower_bound, upper_bound, mape, model_type
               FROM forecast_results 
               WHERE experiment_id = %s AND tenant_id = %s AND sku_id = %s
               ORDER BY date""",
            (experiment_id, current_user["tenant_id"], sku_id)
        )
    else:
        result = db.execute(
            """SELECT result_id, sku_id, date, forecast_value, lower_bound, upper_bound, mape, model_type
               FROM forecast_results 
               WHERE experiment_id = %s AND tenant_id = %s
               ORDER BY date""",
            (experiment_id, current_user["tenant_id"])
        )
    
    forecasts = result.fetchall()
    
    return [
        ForecastResponse(
            result_id=f[0],
            sku_id=f[1],
            date=str(f[2]),
            forecast_value=float(f[3]),
            lower_bound=float(f[4]) if f[4] else None,
            upper_bound=float(f[5]) if f[5] else None,
            mape=float(f[6]) if f[6] else None,
            model_type=f[7]
        )
        for f in forecasts
    ]

# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    return {
        "name": "FMCG Demand Intelligence API",
        "version": "0.1.0-alpha",
        "docs": "/docs",
        "api_url": API_URL
    }

if __name__ == "__main__":
    print("Starting FastAPI server...")
    import uvicorn
    print("Uvicorn imported successfully")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
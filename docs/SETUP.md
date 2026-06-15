# FMCG Demand Intelligence Platform - Setup Guide

## Local Development Setup

### 1. PostgreSQL Database

```bash
createdb -U postgres fmcg_alpha
psql -U postgres -d fmcg_alpha -f docs/SCHEMA.sql
```

Verify:
```bash
psql -U postgres -d fmcg_alpha
SELECT COUNT(*) FROM tenants;
\q
```

### 2. Backend (FastAPI)

```bash
cd orchestrator
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file:

DATABASE_URL=postgresql://postgres:PASSWORD@localhost/fmcg_alpha
API_URL=https://YOUR_NGROK_URL
JWT_SECRET=your-secret-key

Run:
```bash
python main.py
# Server runs on http://localhost:8000
```

### 3. Frontend (React)

```bash
cd frontend
npm install
```

Create `frontend/.env`:

VITE_API_URL=https://YOUR_NGROK_URL

Run:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Public URL (Ngrok)

```bash
ngrok http 8000
# Copy HTTPS URL and update .env files
```

---

## Project Structure

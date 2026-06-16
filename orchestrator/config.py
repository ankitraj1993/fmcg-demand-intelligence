# orchestrator/config.py
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
API_URL = os.getenv("API_URL")
JWT_SECRET = os.getenv("JWT_SECRET")
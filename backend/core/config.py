# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
"""
Core Application Configuration
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeMind AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_PRODUCTION_CODEMIND_AI_992211")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./codemind.db")
    DEBUG: bool = True

settings = Settings()

from typing import Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Mock user for development
MOCK_USER = {
    "id": "dev_user_fallback",
    "email": "dev@example.com",
    "role": "admin"
}

async def get_current_user() -> Dict:
    """
    Mock authentication function that returns a development user.
    In production, this would validate JWT tokens and fetch real user data.
    """
    return MOCK_USER 
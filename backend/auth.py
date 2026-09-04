from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
import os

logger = logging.getLogger(__name__)

# JWT Configuration
# Set the SECRET_KEY environment variable in production instead of relying on
# this fallback - anything hardcoded here is visible to anyone with repo access.
_FALLBACK_SECRET_KEY = "27b89fb02e099abf7108ef2c7877377722e1a99124f72953f017575eb19c78dbecfbb4efa9cef92a20e7ed3ec6f99e52"
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    logger.warning(
        "SECRET_KEY env var is not set - falling back to a built-in key. "
        "Set SECRET_KEY in your deployment environment before going to production."
    )
    SECRET_KEY = _FALLBACK_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user from token.
    Supports both session tokens (Google Auth) and JWT tokens (password auth).
    """
    from database import db
    
    token = credentials.credentials
    
    # Try session token first (Google auth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    
    if session:
        # Check expiration
        expires_at = session["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        
        if datetime.utcnow() > expires_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
        
        # Get user
        user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"id": user["id"], "email": user["email"], "role": user["role"]}
    
    # Fall back to JWT token (password login)
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"id": user_id, "email": payload.get("email"), "role": payload.get("role")}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
import os
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, List
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from backend.database import get_db
from backend.models import UserInDB, CareProfileInDB, PyObjectId

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 30  # 30 days

# Security scheme
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_profile_code() -> str:
    """Generate a unique 6-character profile code."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(secrets.choice(chars) for _ in range(6))
        # Uniqueness checked at DB level
        return code


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> UserInDB:
    """Get current authenticated user from JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    users = db.users
    user_doc = await users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserInDB(**user_doc)


async def get_current_caretaker(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """Ensure current user is a caretaker."""
    if current_user.role != "caretaker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caretaker access required"
        )
    return current_user


async def get_current_elderly(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """Ensure current user is elderly."""
    if current_user.role != "elderly":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Elderly access required"
        )
    return current_user


async def get_user_care_profiles(
    current_user: UserInDB,
    db: AsyncIOMotorDatabase
) -> List[CareProfileInDB]:
    """Get all care profiles associated with the current user."""
    profiles_coll = db.care_profiles

    if current_user.role == "caretaker":
        cursor = profiles_coll.find({"caretaker_user_ids": current_user.id})
    else:
        cursor = profiles_coll.find({"elderly_user_id": current_user.id})

    profiles = []
    async for doc in cursor:
        profiles.append(CareProfileInDB(**doc))
    return profiles


async def get_profile_by_code(
    profile_code: str,
    db: AsyncIOMotorDatabase
) -> Optional[CareProfileInDB]:
    """Get a care profile by its code."""
    profiles_coll = db.care_profiles
    doc = await profiles_coll.find_one({"profile_code": profile_code})
    if doc:
        return CareProfileInDB(**doc)
    return None


async def verify_profile_access(
    profile_id: str,
    current_user: UserInDB,
    db: AsyncIOMotorDatabase
) -> CareProfileInDB:
    """Verify user has access to the profile and return it."""
    profiles_coll = db.care_profiles
    doc = await profiles_coll.find_one({"_id": ObjectId(profile_id)})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    profile = CareProfileInDB(**doc)

    if current_user.role == "caretaker":
        if current_user.id not in profile.caretaker_user_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this profile"
            )
    else:
        if profile.elderly_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this profile"
            )

    return profile
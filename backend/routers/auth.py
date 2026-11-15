from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pydantic import BaseModel

from backend.database import get_db
from backend.models import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    CareProfileCreate,
    CareProfileResponse,
    ProfileIdResponse,
)
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_caretaker,
    get_user_care_profiles,
    get_profile_by_code,
    generate_profile_code,
)
from backend.rate_limiter import rate_limit


class DeleteAccountRequest(BaseModel):
    """Request model for account deletion."""
    password: str  # Require password confirmation for deletion

router = APIRouter()


def user_to_response(user_doc: dict) -> UserResponse:
    """Convert user document to response."""
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        role=user_doc["role"],
        display_name=user_doc["display_name"],
        created_at=user_doc.get("created_at", datetime.utcnow())
    )


def profile_to_response(profile_doc: dict) -> CareProfileResponse:
    """Convert profile document to response."""
    return CareProfileResponse(
        id=str(profile_doc["_id"]),
        profile_code=profile_doc["profile_code"],
        name=profile_doc["name"],
        age=profile_doc["age"],
        elderly_user_id=str(profile_doc["elderly_user_id"]),
        caretaker_user_ids=[str(uid) for uid in profile_doc.get("caretaker_user_ids", [])],
        created_at=profile_doc.get("created_at", datetime.utcnow())
    )


@router.post("/auth/register", response_model=TokenResponse, dependencies=[Depends(rate_limit("/api/v1/auth/register"))])
async def register(
    user_data: UserRegister,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Register a new user. First user auto-creates a Care Profile."""
    users = db.users

    # Check if email already exists
    existing = await users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Hash password
    password_hash = hash_password(user_data.password)

    # Create user
    user_doc = {
        "email": user_data.email,
        "password_hash": password_hash,
        "role": user_data.role,
        "display_name": user_data.display_name,
        "created_at": datetime.utcnow()
    }
    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Auto-create a care profile for every registered caretaker
    profile_code = None
    profile_id = None
    user_count = await users.count_documents({})

    if user_data.role == "caretaker" or user_count == 1:
        # First user - create care profile
        profiles = db.care_profiles

        # Generate unique profile code
        while True:
            code = generate_profile_code()
            existing_code = await profiles.find_one({"profile_code": code})
            if not existing_code:
                profile_code = code
                break

        pin_hash = hash_password(user_data.password)

        if user_data.role == "caretaker":
            profile_doc = {
                "profile_code": profile_code,
                "name": user_data.display_name,
                "age": 65,  # default age
                "elderly_user_id": user_doc["_id"],
                "caretaker_user_ids": [user_doc["_id"]],
                "pin_hash": pin_hash,
                "created_at": datetime.utcnow()
            }
        else:
            profile_doc = {
                "profile_code": profile_code,
                "name": user_data.display_name,
                "age": 65,
                "elderly_user_id": user_doc["_id"],
                "caretaker_user_ids": [],
                "pin_hash": pin_hash,
                "created_at": datetime.utcnow()
            }

        await profiles.insert_one(profile_doc)
        profile_id = str(profile_doc["_id"])

    # Create token
    token = create_access_token({"sub": str(user_doc["_id"]), "role": user_data.role})

    return TokenResponse(
        token=token,
        user=user_to_response(user_doc),
        profile_code=profile_code,
        profile_id=profile_id
    )


@router.post("/auth/login", response_model=TokenResponse, dependencies=[Depends(rate_limit("/api/v1/auth/login"))])
async def login(
    login_data: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Login with email and password."""
    users = db.users

    user_doc = await users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create token
    token = create_access_token(
        {"sub": str(user_doc["_id"]), "role": user_doc["role"]}
    )

    # Get profile for this user
    profile_code = None
    profile_id = None
    profiles = db.care_profiles

    if user_doc["role"] == "caretaker":
        profile = await profiles.find_one({"caretaker_user_ids": user_doc["_id"]})
    else:
        profile = await profiles.find_one({"elderly_user_id": user_doc["_id"]})

    if profile:
        profile_code = profile["profile_code"]
        profile_id = str(profile["_id"])

    return TokenResponse(
        token=token,
        user=user_to_response(user_doc),
        profile_code=profile_code,
        profile_id=profile_id
    )


@router.get("/profiles/me")
async def get_my_profiles(
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get the logged-in user's profile + all linked elderly profiles."""
    profiles = await get_user_care_profiles(current_user, db)

    return {
        "user": user_to_response(current_user.model_dump(by_alias=True)),
        "profiles": [profile_to_response(p.model_dump(by_alias=True)) for p in profiles]
    }


@router.get("/profiles/{profile_code}")
async def get_profile_by_code(
    profile_code: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Public lookup for join flow (no auth)."""
    profile = await get_profile_by_code(profile_code, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    return profile_to_response(profile.model_dump(by_alias=True))


@router.delete("/auth/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    request: DeleteAccountRequest,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Soft-delete the current user's account.
    Sets deleted_at timestamp, preserves referential integrity.
    Requires password confirmation.
    """
    users = db.users
    profiles = db.care_profiles

    # Verify password
    user_doc = await users.find_one({"_id": current_user.id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(request.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    # Soft delete user
    await users.update_one(
        {"_id": current_user.id},
        {"$set": {"deleted_at": datetime.utcnow(), "email": f"deleted_{user_doc['email']}"}}
    )

    # Also soft delete associated profiles where this user is the elderly user
    # (Caretaker profiles are not deleted as they may have other caretakers)
    await profiles.update_many(
        {"elderly_user_id": current_user.id},
        {"$set": {"deleted_at": datetime.utcnow()}}
    )

    return None
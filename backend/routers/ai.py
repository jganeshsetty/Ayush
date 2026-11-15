"""AI router: prescription parsing, safety checks, voice check-ins."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.database import get_db
from backend.auth import get_current_user, verify_profile_access
from backend.models import UserInDB
from backend.services.ai_service import parse_prescription, safety_check, voice_checkin
from backend.rate_limiter import rate_limit

router = APIRouter()


class SafetyCheckRequest(BaseModel):
    profile_id: str
    medication_id: Optional[str] = None


class VoiceCheckinRequest(BaseModel):
    profile_id: str
    text: str = Field(..., min_length=1, max_length=500)


MAX_PRESCRIPTION_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/ai/parse-prescription", dependencies=[Depends(rate_limit("/api/v1/ai/parse-prescription"))])
async def parse_prescription_endpoint(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
):
    """Parse a prescription image/doctor note via Gemini -> Groq -> NVIDIA fallback."""
    try:
        image_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {exc}",
        )

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded",
        )

    if len(image_bytes) > MAX_PRESCRIPTION_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_PRESCRIPTION_SIZE // (1024*1024)} MB",
        )

    try:
        result = await parse_prescription(image_bytes, file.filename or "prescription")
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "source": "error",
                "error": str(exc),
                "medication_name": None,
                "dosage": None,
                "frequency": None,
                "times": [],
                "instructions": None,
            },
        )

    return result


@router.post("/ai/safety-check", dependencies=[Depends(rate_limit("/api/v1/ai/safety-check"))])
async def safety_check_endpoint(
    body: SafetyCheckRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Cross-check a medication against the profile's active list."""
    await verify_profile_access(body.profile_id, current_user, db)
    try:
        result = await safety_check(body.profile_id, body.medication_id, db)
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "safe": True,
                "interactions": [],
                "source": "error",
                "error": str(exc),
            },
        )
    return result


@router.post("/ai/voice-checkin", dependencies=[Depends(rate_limit("/api/v1/ai/voice-checkin"))])
async def voice_checkin_endpoint(
    body: VoiceCheckinRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Parse a natural-language voice check-in and flag symptoms."""
    await verify_profile_access(body.profile_id, current_user, db)
    try:
        result = await voice_checkin(body.profile_id, body.text)
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "dose_marked_taken": False,
                "medication_hint": None,
                "symptom_flagged": False,
                "symptom": None,
                "summary": body.text,
                "action": "record_note",
                "source": "error",
                "error": str(exc),
            },
        )
    return result
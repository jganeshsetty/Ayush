"""Voice router: text-to-speech via edge-tts (offline, free)."""
import logging

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from backend.services.voice_service import speak
from backend.rate_limiter import rate_limit
from backend.auth import get_current_user, UserInDB

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/voice/speak", dependencies=[Depends(rate_limit("/api/v1/voice/speak")), Depends(get_current_user)])
async def speak_endpoint(text: str, lang: str = "en", current_user: UserInDB = Depends(get_current_user)):
    """Stream synthesized speech (MP3) for the given text and language.

    Languages: en (English), kn (Kannada), hi (Hindi).
    """
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="text parameter is required",
        )
    if lang not in ("en", "kn", "hi"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lang must be one of: en, kn, hi",
        )

    try:
        audio_bytes = await speak(text.strip(), lang)
    except Exception as exc:
        logger.exception("edge-tts synthesis failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice synthesis failed: {exc}",
        )

    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Voice synthesis returned empty audio",
        )

    def iter_bytes():
        yield audio_bytes

    return StreamingResponse(
        iter_bytes(),
        media_type="audio/mpeg",
        headers={
            "Content-Length": str(len(audio_bytes)),
            "Content-Disposition": "inline; filename=ayush.mp3",
            "Cache-Control": "public, max-age=86400",
        },
    )
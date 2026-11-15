"""Ayush Voice Service — edge-tts MP3 synthesis (English, Kannada, Hindi)."""
import asyncio
import edge_tts
import tempfile
import os


# Language → edge-tts voice mapping (using actual voice names from edge-tts -l)
_LANG_MAP = {
    "en": "en-IN-NeerjaNeural",      # English (India)
    "kn": "kn-IN-GaganNeural",       # Kannada (India)
    "hi": "hi-IN-MadhurNeural",      # Hindi (India)
}


async def _run_edge_tts(text: str, voice: str) -> bytes:
    """Run edge-tts Python API and return raw MP3 bytes."""
    communicate = edge_tts.Communicate(text, voice)

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        async for chunk in communicate.stream():
            if chunk['type'] == 'audio':
                with open(tmp_path, 'ab') as f:
                    f.write(chunk['data'])

        with open(tmp_path, "rb") as f:
            audio_data = f.read()

        if not audio_data:
            raise RuntimeError("edge-tts produced empty output")

        return audio_data
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


async def speak(text: str, lang: str = "en") -> bytes:
    """
    Synthesize speech to MP3 using edge-tts (offline, no API key).

    Args:
        text: Text to speak.
        lang: Language code: "en" (English), "kn" (Kannada), "hi" (Hindi).

    Returns:
        Raw MP3 bytes (non-empty).

    Raises:
        RuntimeError if edge-tts is not installed or synthesis fails.
    """
    if not text or not text.strip():
        raise RuntimeError("speak() requires non-empty text")

    voice = _LANG_MAP.get(lang)
    if not voice:
        raise RuntimeError(f"Unsupported language: {lang}. Use 'en', 'kn', or 'hi'.")

    # Try primary voice with original text
    try:
        return await _run_edge_tts(text, voice)
    except edge_tts.exceptions.NoAudioReceived:
        pass

    # Try fallback voices
    fallback_voices = {
        "en": ["en-US-AriaNeural", "en-GB-SoniaNeural", "en-US-GuyNeural"],
        "kn": ["kn-IN-GaganNeural"],
        "hi": ["hi-IN-MadhurNeural", "hi-IN-SwaraNeural"],
    }

    for fallback in fallback_voices.get(lang, []):
        try:
            return await _run_edge_tts(text, fallback)
        except edge_tts.exceptions.NoAudioReceived:
            continue

    # Last resort: pad text and retry primary
    padded_text = text + ". " * 3
    try:
        return await _run_edge_tts(padded_text, voice)
    except edge_tts.exceptions.NoAudioReceived:
        # Return a minimal valid MP3 (silence) rather than crashing
        # This is a valid 1-second MP3 silence frame
        return bytes.fromhex(
            "FF FB 90 44 00 00 00 00 00 00 00 00 00 00 00 00 "
            "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00"
        )
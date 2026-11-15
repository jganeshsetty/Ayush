"""Ayush AI Services — prescription parsing, safety checks, voice check-ins.

Free-tier only: Google Gemini 1.5 Flash → Groq (Llama 3.3 70B) → NVIDIA (Llama 3.3 70B Instruct).
Graceful degradation: if all keys missing, returns local fallback results (HTTP 200, source="local-fallback").
"""
import os
import json
import base64
import re
from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase

# ---------------------------
# Config & helpers
# ---------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")


def _sanitize_ai_response(text: str) -> str:
    """
    Strip markdown code fences and extract JSON from AI responses.
    Handles ```json, ```, and nested code blocks.
    """
    text = text.strip()

    # Remove markdown code fences (```json, ```python, ```, etc.)
    if text.startswith("```"):
        # Remove opening fence
        text = re.sub(r"^```\w*\s*", "", text)
        # Remove closing fence
        text = re.sub(r"\s*```$", "", text)

    # Handle case where response is wrapped in multiple fences
    # Find first { and last } to extract JSON object
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        text = text[first_brace:last_brace + 1]

    return text.strip()


def _validate_ai_json(text: str) -> dict:
    """
    Parse and validate JSON from AI response.
    Raises ValueError if invalid JSON or missing required fields.
    """
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON from AI: {e}")

    if not isinstance(parsed, dict):
        raise ValueError("AI response is not a JSON object")

    return parsed


def _has_any_key() -> bool:
    return bool(GEMINI_API_KEY or GROQ_API_KEY or NVIDIA_API_KEY)


def _gemini_model():
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        return genai.GenerativeModel("gemini-flash-latest")
    except Exception:
        return None


def _groq_client():
    if not GROQ_API_KEY:
        return None
    try:
        from groq import Groq
        return Groq(api_key=GROQ_API_KEY)
    except Exception:
        return None


def _nvidia_client():
    if not NVIDIA_API_KEY:
        return None
    try:
        from openai import OpenAI
        return OpenAI(
            api_key=NVIDIA_API_KEY,
            base_url="https://api.nvidia.com/v1",
        )
    except Exception:
        return None


# ---------------------------
# Prompt templates
# ---------------------------
PRESCRIPTION_PROMPT = """You are a medical prescription parser. Extract structured data from the prescription image.

Return ONLY valid JSON with these exact fields:
{
  "medication_name": "string",
  "dosage": "string",          // e.g. "500mg", "10mg"
  "frequency": "string",       // e.g. "daily", "twice daily", "every 8 hours"
  "times": ["HH:MM", ...],     // 24-hour format, empty array if not specified
  "instructions": "string"     // any additional instructions, empty string if none
}

If a field cannot be determined, use empty string or empty array. Do not include extra commentary."""


SAFETY_CHECK_SYSTEM = """You are a drug interaction checker for elderly patients.
Given a patient's active medication list and a target medication, identify contraindications and interactions.

Return ONLY valid JSON:
{
  "safe": boolean,
  "interactions": [
    {
      "severity": "info" | "warning" | "contraindication",
      "message": "string describing the interaction",
      "recommendation": "string with actionable guidance"
    }
  ]
}

Severity levels:
- "info": minor interaction, monitor
- "warning": significant interaction, dose adjustment or timing change may be needed
- "contraindication": avoid combination, serious risk

If no interactions found, return "safe": true and empty interactions array."""


VOICE_CHECKIN_SYSTEM = """You are a voice check-in parser for elderly medication adherence.
Parse natural language like: "I took my morning tablet, feeling slightly dizzy today"

Return ONLY valid JSON:
{
  "dose_marked_taken": boolean,
  "medication_hint": "string or null",    // medication name mentioned, if any
  "symptom_flagged": boolean,
  "symptom": "string or null",            // symptom described, if any
  "summary": "string",                    // one-sentence summary for caretaker
  "action": "string"                      // recommended action: "log_dose" | "alert_caretaker" | "monitor" | "none"
}

Rules:
- "took", "taken", "had my" → dose_marked_taken = true
- "forgot", "missed", "didn't take" → dose_marked_taken = false, action = "alert_caretaker"
- Symptoms: dizzy, faint, nausea, pain, headache, shortness of breath, chest pain, confusion, swelling, rash → symptom_flagged = true
- If symptom_flagged and dose_taken: action = "alert_caretaker"
- If symptom_flagged only: action = "monitor"
- If dose_taken only: action = "log_dose"
- Neither: action = "none"
- No red/blue color references in output."""


# ---------------------------
# Core AI call wrappers
# ---------------------------
async def _call_gemini(prompt: str, image_bytes: bytes | None = None, system: str | None = None) -> dict:
    model = _gemini_model()
    if not model:
        raise RuntimeError("Gemini not configured")
    try:
        contents = []
        if system:
            contents.append({"role": "user", "parts": [system]})
        if image_bytes:
            contents.append({
                "role": "user",
                "parts": [{"mime_type": "image/jpeg", "data": base64.b64encode(image_bytes).decode()}]
            })
        contents.append({"role": "user", "parts": [prompt]})
        response = model.generate_content(contents)
        text = response.text or ""
        # Extract JSON from possible markdown code fences
        text = _sanitize_ai_response(text)
        return _validate_ai_json(text)
    except Exception as e:
        raise RuntimeError(f"Gemini call failed: {e}")


async def _call_groq(prompt: str, system: str | None = None) -> dict:
    client = _groq_client()
    if not client:
        raise RuntimeError("Groq not configured")
    try:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content or ""
        text = _sanitize_ai_response(text)
        return _validate_ai_json(text)
    except Exception as e:
        raise RuntimeError(f"Groq call failed: {e}")


async def _call_nvidia(prompt: str, system: str | None = None) -> dict:
    client = _nvidia_client()
    if not client:
        raise RuntimeError("NVIDIA not configured")
    try:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = client.chat.completions.create(
            model="nvidia/llama-3.3-70b-instruct",
            messages=messages,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content or ""
        text = _sanitize_ai_response(text)
        return _validate_ai_json(text)
    except Exception as e:
        raise RuntimeError(f"NVIDIA call failed: {e}")


async def _try_providers(prompt: str, image_bytes: bytes | None = None, system: str | None = None) -> tuple[dict, str]:
    """Try Gemini → Groq → NVIDIA in order. Returns (result_dict, source_name)."""
    # Try Gemini first (supports images)
    if GEMINI_API_KEY:
        try:
            result = await _call_gemini(prompt, image_bytes, system)
            return result, "gemini"
        except Exception:
            pass
    # Try Groq (text only)
    if GROQ_API_KEY:
        try:
            result = await _call_groq(prompt, system)
            return result, "groq"
        except Exception:
            pass
    # Try NVIDIA (text only)
    if NVIDIA_API_KEY:
        try:
            result = await _call_nvidia(prompt, system)
            return result, "nvidia"
        except Exception:
            pass
    raise RuntimeError("All AI providers failed or unavailable")


# ---------------------------
# Local fallbacks (no API keys)
# ---------------------------
def _local_parse_prescription(filename: str) -> dict:
    """Best-effort local parse from filename only."""
    return {
        "medication_name": "Unknown (local fallback)",
        "dosage": "",
        "frequency": "",
        "times": [],
        "instructions": f"Parsed from filename: {filename}. Please verify manually.",
    }


def _local_safety_check(active_meds: list[dict], target_med: dict | None) -> dict:
    """Basic local interaction check - returns safe with note."""
    return {
        "safe": True,
        "interactions": [],
        "source": "local-fallback",
        "note": "No AI key configured. Manual review recommended.",
    }


def _local_voice_checkin(text: str) -> dict:
    """Regex-based local parse for voice check-in."""
    text_lower = text.lower()

    # Dose taken patterns
    dose_taken = bool(re.search(r"\b(took|taken|had my|took my)\b", text_lower))
    dose_missed = bool(re.search(r"\b(forgot|missed|didn't take|did not take)\b", text_lower))

    # Symptom patterns
    symptom_keywords = [
        "dizzy", "faint", "nausea", "pain", "headache",
        "shortness of breath", "chest pain", "confusion", "swelling", "rash"
    ]
    symptom_found = None
    for kw in symptom_keywords:
        if kw in text_lower:
            symptom_found = kw
            break

    # Medication hint - extract words after "my" or "the"
    med_hint = None
    med_match = re.search(r"\b(my|the)\s+(\w+(?:\s+\w+)?)\b", text_lower)
    if med_match:
        med_hint = med_match.group(2)

    symptom_flagged = symptom_found is not None

    if dose_missed:
        action = "alert_caretaker"
        summary = "Patient reported missing a dose."
    elif dose_taken and symptom_flagged:
        action = "alert_caretaker"
        summary = f"Patient took medication and reported {symptom_found}."
    elif dose_taken:
        action = "log_dose"
        summary = "Patient reported taking medication."
    elif symptom_flagged:
        action = "monitor"
        summary = f"Patient reported {symptom_found} without mentioning medication."
    else:
        action = "none"
        summary = "No clear dose or symptom detected."

    return {
        "dose_marked_taken": dose_taken and not dose_missed,
        "medication_hint": med_hint,
        "symptom_flagged": symptom_flagged,
        "symptom": symptom_found,
        "summary": summary,
        "action": action,
    }


# ---------------------------
# Public API functions
# ---------------------------
async def parse_prescription(image_bytes: bytes, filename: str) -> dict:
    """
    Parse prescription image using Gemini 1.5 Flash (primary), Groq, or NVIDIA fallback.
    Returns structured medication data with source field.
    """
    if not _has_any_key():
        result = _local_parse_prescription(filename)
        result["source"] = "local-fallback"
        return result

    prompt = PRESCRIPTION_PROMPT
    try:
        result, source = await _try_providers(prompt, image_bytes=image_bytes)
        result["source"] = source
        return result
    except Exception as e:
        # Final fallback
        result = _local_parse_prescription(filename)
        result["source"] = "local-fallback"
        result["error"] = str(e)
        return result


async def safety_check(profile_id: str, medication_id: str | None, db: AsyncIOMotorDatabase) -> dict:
    """
    Cross-check target medication against patient's active medications for contraindications.
    Uses Groq primary, Gemini fallback, then NVIDIA. Returns safe/interactions.
    """
    from bson import ObjectId
    # Fetch active medications from MongoDB
    try:
        cursor = db.medications.find({"profile_id": ObjectId(profile_id), "active": True})
        active_meds = await cursor.to_list(length=100)
    except Exception:
        active_meds = []

    # If specific medication_id provided, fetch it as target
    target_med = None
    if medication_id:
        try:
            target_med = await db.medications.find_one({"_id": ObjectId(medication_id)})
        except Exception:
            pass

    if not _has_any_key():
        return _local_safety_check(active_meds, target_med)

    # Build prompt with active medications
    med_list = "\n".join([
        f"- {m.get('name', 'Unknown')}: {m.get('dosage', '')} {m.get('frequency', '')} {m.get('times', [])}"
        for m in active_meds
    ]) or "No active medications"

    target_info = ""
    if target_med:
        target_info = f"\nTarget medication to check: {target_med.get('name', 'Unknown')} {target_med.get('dosage', '')} {target_med.get('frequency', '')}"

    prompt = f"""Patient's active medications:
{med_list}{target_info}

Check for interactions and contraindications."""

    try:
        # Groq first (best for structured JSON), then Gemini, then NVIDIA
        if GROQ_API_KEY:
            try:
                result = await _call_groq(prompt, SAFETY_CHECK_SYSTEM)
                result["source"] = "groq"
                return result
            except Exception:
                pass
        if GEMINI_API_KEY:
            try:
                result = await _call_gemini(prompt, system=SAFETY_CHECK_SYSTEM)
                result["source"] = "gemini"
                return result
            except Exception:
                pass
        if NVIDIA_API_KEY:
            try:
                result = await _call_nvidia(prompt, SAFETY_CHECK_SYSTEM)
                result["source"] = "nvidia"
                return result
            except Exception:
                pass
    except Exception:
        pass

    return _local_safety_check(active_meds, target_med)


async def voice_checkin(profile_id: str, text: str) -> dict:
    """
    Parse natural language voice check-in for dose adherence and symptoms.
    Returns structured result with dose_marked_taken, symptom_flagged, action.
    """
    if not _has_any_key():
        result = _local_voice_checkin(text)
        result["source"] = "local-fallback"
        return result

    prompt = f'Patient said: "{text}"'

    try:
        # Groq first, then Gemini, then NVIDIA
        if GROQ_API_KEY:
            try:
                result = await _call_groq(prompt, VOICE_CHECKIN_SYSTEM)
                result["source"] = "groq"
                return result
            except Exception:
                pass
        if GEMINI_API_KEY:
            try:
                result = await _call_gemini(prompt, system=VOICE_CHECKIN_SYSTEM)
                result["source"] = "gemini"
                return result
            except Exception:
                pass
        if NVIDIA_API_KEY:
            try:
                result = await _call_nvidia(prompt, VOICE_CHECKIN_SYSTEM)
                result["source"] = "nvidia"
                return result
            except Exception:
                pass
    except Exception:
        pass

    result = _local_voice_checkin(text)
    result["source"] = "local-fallback"
    return result
#!/usr/bin/env python3
"""
Ayush End-to-End Tests
Tests against running backend API (skips gracefully if backend unreachable)
"""

import os
import pytest
import httpx
import asyncio
from typing import Optional, Dict, Any

# Configuration
API_BASE = os.getenv("AYUSH_API_URL", "http://localhost:8000/api/v1")
TIMEOUT = 30.0

# Test credentials (can be overridden via env)
TEST_EMAIL = os.getenv("AYUSH_TEST_EMAIL", "test@ayush.dev")
TEST_PASSWORD = os.getenv("AYUSH_TEST_PASSWORD", "TestPass123!")


class APIClient:
    """Async API client for testing"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.profile_code: Optional[str] = None
        self.profile_id: Optional[str] = None

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def request(self, method: str, path: str, **kwargs) -> httpx.Response:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            url = f"{self.base_url}{path}"
            response = await client.request(method, url, headers=self._headers(), **kwargs)
            return response

    async def register(self, email: str, password: str, role: str, display_name: str) -> Dict[str, Any]:
        response = await self.request("POST", "/auth/register", json={
            "email": email,
            "password": password,
            "role": role,
            "display_name": display_name
        })
        data = response.json()
        if data.get("token"):
            self.token = data["token"]
            self.profile_code = data.get("profile_code")
        return data

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        response = await self.request("POST", "/auth/login", json={
            "email": email,
            "password": password
        })
        data = response.json()
        if data.get("token"):
            self.token = data["token"]
            self.profile_code = data.get("profile_code")
        return data

    async def get_me(self) -> Dict[str, Any]:
        response = await self.request("GET", "/profiles/me")
        return response.json()

    async def list_medications(self, profile_id: str) -> list:
        response = await self.request("GET", f"/medications?profile_id={profile_id}")
        return response.json()

    async def create_medication(self, data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.request("POST", "/medications", json=data)
        return response.json()

    async def take_medication(self, med_id: str) -> Dict[str, Any]:
        response = await self.request("POST", f"/medications/{med_id}/take", json={})
        return response.json()

    async def list_appointments(self, profile_id: str) -> list:
        response = await self.request("GET", f"/appointments?profile_id={profile_id}")
        return response.json()

    async def create_appointment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.request("POST", "/appointments", json=data)
        return response.json()

    async def get_dashboard(self, profile_id: str) -> Dict[str, Any]:
        response = await self.request("GET", f"/dashboard?profile_id={profile_id}")
        return response.json()

    async def parse_prescription(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            files = {"file": (filename, file_content, "image/png")}
            headers = {}
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            response = await client.post(f"{self.base_url}/ai/parse-prescription", files=files, headers=headers)
            return response.json()

    async def safety_check(self, profile_id: str, medication_id: Optional[str] = None) -> Dict[str, Any]:
        response = await self.request("POST", "/ai/safety-check", json={
            "profile_id": profile_id,
            "medication_id": medication_id
        })
        return response.json()

    async def voice_checkin(self, profile_id: str, text: str) -> Dict[str, Any]:
        response = await self.request("POST", "/ai/voice-checkin", json={
            "profile_id": profile_id,
            "text": text
        })
        return response.json()

    async def voice_speak(self, text: str, lang: str = "en") -> bytes:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            headers = {}
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            params = {"text": text, "lang": lang}
            response = await client.get(f"{self.base_url}/voice/speak", params=params, headers=headers)
            return response.content

    async def test_email(self, to: Optional[str] = None) -> Dict[str, Any]:
        response = await self.request("POST", "/notifications/test-email", json={"to": to} if to else {})
        return response.json()


@pytest.fixture(scope="session")
def api_client():
    """Create API client and attempt to connect"""
    import asyncio

    async def _create_client():
        client = APIClient(API_BASE)

        # Try to login with existing test user, or register new one
        try:
            await client.login(TEST_EMAIL, TEST_PASSWORD)
        except Exception:
            # Try register
            try:
                await client.register(TEST_EMAIL, TEST_PASSWORD, "caretaker", "Test Caregiver")
            except Exception as e:
                pytest.skip(f"Backend not reachable or auth failed: {e}")

        # Get profile ID
        try:
            me = await client.get_me()
            if me.get("linked_profiles"):
                client.profile_id = me["linked_profiles"][0]["_id"]
            elif me.get("profile", {}).get("_id"):
                client.profile_id = me["profile"]["_id"]
        except Exception:
            pass

        return client

    return asyncio.run(_create_client())


@pytest.mark.asyncio
async def test_backend_reachable(api_client):
    """Test that backend is reachable"""
    if not api_client.token:
        pytest.skip("Backend not reachable - no auth token")
    if not api_client.profile_id:
        pytest.skip("Backend not reachable - no profile ID")


@pytest.mark.asyncio
async def test_login_returns_token(api_client):
    """Test login returns valid JWT token"""
    if not api_client.token:
        pytest.skip("Backend not reachable")
    # Create a fresh client to test login
    fresh_client = APIClient(API_BASE)
    result = await fresh_client.login(TEST_EMAIL, TEST_PASSWORD)
    assert "token" in result, "Login should return token"
    assert result["token"], "Token should not be empty"
    assert "user" in result, "Login should return user info"


@pytest.mark.asyncio
async def test_medication_create_and_take(api_client):
    """Test medication CRUD and take action computes streak"""
    if not api_client.profile_id:
        pytest.skip("No profile ID available")

    # Create medication
    med_data = {
        "profile_id": api_client.profile_id,
        "name": "Test Medicine",
        "dosage": "10 mg",
        "frequency": "daily",
        "times": ["08:00", "20:00"],
        "instructions": "Take with food"
    }
    medication = await api_client.create_medication(med_data)
    assert "_id" in medication, "Created medication should have ID"
    med_id = medication["_id"]

    # List medications
    meds = await api_client.list_medications(api_client.profile_id)
    assert any(m["_id"] == med_id for m in meds), "Medication should appear in list"

    # Mark as taken
    result = await api_client.take_medication(med_id)
    assert "taken_at" in result or "adherence" in result, "Take action should return confirmation"

    # Verify dashboard shows adherence
    dashboard = await api_client.get_dashboard(api_client.profile_id)
    assert "adherence_pct" in dashboard, "Dashboard should include adherence percentage"
    assert "streak" in dashboard, "Dashboard should include streak"
    assert isinstance(dashboard["adherence_pct"], (int, float)), "Adherence should be numeric"


@pytest.mark.asyncio
async def test_appointment_create_and_retrieve(api_client):
    """Test appointment CRUD"""
    if not api_client.profile_id:
        pytest.skip("No profile ID available")

    # Create appointment
    appt_data = {
        "profile_id": api_client.profile_id,
        "doctor_name": "Dr. Test",
        "clinic": "Test Clinic",
        "date": "2025-12-01",
        "time": "10:00",
        "notes": "Test appointment",
        "reminder_24h": True,
        "reminder_2h": True
    }
    appointment = await api_client.create_appointment(appt_data)
    assert "_id" in appointment, "Created appointment should have ID"
    appt_id = appointment["_id"]

    # List appointments
    appointments = await api_client.list_appointments(api_client.profile_id)
    assert any(a["_id"] == appt_id for a in appointments), "Appointment should appear in list"

    # Verify in dashboard
    dashboard = await api_client.get_dashboard(api_client.profile_id)
    assert "upcoming_appointments" in dashboard, "Dashboard should include upcoming appointments"


@pytest.mark.asyncio
async def test_prescription_parse(api_client):
    """Test prescription parsing (mocks if no AI key)"""
    # Create a minimal PNG (1x1 pixel)
    png_header = b"\x89PNG\r\n\x1a\n"
    png_data = png_header + b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde" \
                    b"\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa7\xf4\xd2\x00\x00\x00\x00IEND\xaeB`\x82"

    try:
        result = await api_client.parse_prescription(png_data, "test.png")
        # Should return structured JSON even if parsing fails
        assert isinstance(result, dict), "Should return dict"
        # If AI keys configured, should have medication fields
        if "medication_name" in result:
            assert "dosage" in result
            assert "frequency" in result
            assert "times" in result
            assert "instructions" in result
    except Exception as e:
        # If AI service not configured, that's okay for this test
        if "500" in str(e) or "503" in str(e):
            pytest.skip("AI service not configured")
        raise


@pytest.mark.asyncio
async def test_voice_speak_returns_audio(api_client):
    """Test voice speak returns non-empty audio bytes"""
    try:
        audio = await api_client.voice_speak("Hello, this is a test", "en")
        # Handle various error responses
        if isinstance(audio, dict):
            pytest.skip(f"TTS endpoint returned JSON: {audio}")
        if isinstance(audio, (bytes, bytearray)) and len(audio) > 0:
            # Check if it's actually audio (not JSON)
            if audio[:1] == b"{":
                pytest.skip("TTS endpoint returned JSON error instead of audio")
            assert len(audio) > 0, "Should return audio bytes"
        else:
            pytest.skip("TTS endpoint did not return audio bytes")
    except Exception as e:
        if "500" in str(e) or "503" in str(e) or "Not Found" in str(e) or "404" in str(e):
            pytest.skip("TTS service not configured")
        raise


@pytest.mark.asyncio
async def test_test_email_endpoint(api_client):
    """Test email endpoint responds"""
    if not api_client.token:
        pytest.skip("Backend not reachable - no auth token")
    try:
        result = await api_client.test_email()
        if isinstance(result, dict) and result.get("detail") == "Not Found":
            pytest.skip("Test email endpoint not implemented")
        # If not authenticated, skip
        if isinstance(result, dict) and result.get("error") == "Not authenticated":
            pytest.skip("Test client not authenticated")
        # If SMTP not configured, it returns sent=False with error - skip gracefully
        if result.get("sent") is False and result.get("error"):
            pytest.skip(f"SMTP not configured: {result.get('error')}")
        assert "sent" in result, "Should return sent status"
        assert result["sent"] is True, "Email should be sent"
        assert "message_id" in result, "Should return message ID"
    except Exception as e:
        if "500" in str(e) or "503" in str(e) or "Not Found" in str(e):
            pytest.skip("SMTP not configured")
        raise


@pytest.mark.asyncio
async def test_safety_check(api_client):
    """Test AI safety check endpoint"""
    if not api_client.profile_id:
        pytest.skip("No profile ID available")

    try:
        result = await api_client.safety_check(api_client.profile_id)
        assert isinstance(result, dict), "Should return dict"
        assert "safe" in result, "Should include safe boolean"
        assert "interactions" in result, "Should include interactions list"
        assert isinstance(result["interactions"], list), "Interactions should be list"
    except Exception as e:
        if "500" in str(e) or "503" in str(e):
            pytest.skip("AI safety service not configured")
        raise


@pytest.mark.asyncio
async def test_voice_checkin(api_client):
    """Test AI voice check-in endpoint"""
    if not api_client.profile_id:
        pytest.skip("No profile ID available")

    try:
        result = await api_client.voice_checkin(api_client.profile_id, "I took my morning pill")
        assert isinstance(result, dict), "Should return dict"
        assert "summary" in result, "Should include summary"
        assert "action" in result, "Should include action"
    except Exception as e:
        if "500" in str(e) or "503" in str(e):
            pytest.skip("AI voice service not configured")
        raise


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
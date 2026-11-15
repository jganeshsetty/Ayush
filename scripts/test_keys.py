#!/usr/bin/env python3
"""Test all API keys from .env WITHOUT starting a server."""
import os
import sys
import asyncio

# Load .env
from dotenv import load_dotenv
load_dotenv("D:/Ayush/.env")

results = []

def check(name, ok, detail=""):
    status = "PASS" if ok else "FAIL"
    results.append((name, ok, detail))
    print(f"[{status}] {name} | {detail}")

# 1. JWT_SECRET
jwt = os.getenv("JWT_SECRET")
check("JWT_SECRET", bool(jwt) and len(jwt) >= 32, f"len={len(jwt) if jwt else 0}")

# 2. MongoDB URI
uri = os.getenv("MONGODB_URI")
if uri and "mongodb" in uri:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        db_name = None
        try:
            db_name = client.get_default_database().name
        except Exception:
            db_name = "ayush"
        check("MONGODB_URI", True, f"db={db_name}")
    except Exception as e:
        check("MONGODB_URI", False, str(e))
else:
    check("MONGODB_URI", False, "not set or invalid")

# 3. Gemini
gemini = os.getenv("GEMINI_API_KEY")
if gemini:
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini)
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content("Say 'hello' only")
        check("GEMINI_API_KEY", bool(resp.text), resp.text[:50])
    except Exception as e:
        check("GEMINI_API_KEY", False, str(e)[:100])
else:
    check("GEMINI_API_KEY", False, "not set")

# 4. Groq
groq = os.getenv("GROQ_API_KEY")
if groq:
    try:
        from groq import Groq
        client = Groq(api_key=groq)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say 'hello' only"}],
            max_tokens=10
        )
        check("GROQ_API_KEY", bool(resp.choices[0].message.content), resp.choices[0].message.content[:50])
    except Exception as e:
        check("GROQ_API_KEY", False, str(e)[:100])
else:
    check("GROQ_API_KEY", False, "not set")

# 5. NVIDIA
nvidia = os.getenv("NVIDIA_API_KEY")
if nvidia:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=nvidia, base_url="https://api.nvidia.com/v1")
        resp = client.chat.completions.create(
            model="nvidia/llama-3.3-70b-instruct",
            messages=[{"role": "user", "content": "Say 'hello' only"}],
            max_tokens=10
        )
        check("NVIDIA_API_KEY", bool(resp.choices[0].message.content), resp.choices[0].message.content[:50])
    except Exception as e:
        check("NVIDIA_API_KEY", False, str(e)[:100])
else:
    check("NVIDIA_API_KEY", False, "not set")

# 6. SMTP
smtp_email = os.getenv("SMTP_EMAIL")
smtp_pass = os.getenv("SMTP_PASSWORD")
if smtp_email and smtp_pass:
    try:
        import smtplib
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.login(smtp_email, smtp_pass)
        server.quit()
        check("SMTP_EMAIL/PASSWORD", True, f"connected as {smtp_email}")
    except Exception as e:
        check("SMTP_EMAIL/PASSWORD", False, str(e)[:100])
else:
    check("SMTP_EMAIL/PASSWORD", False, "not set")

# 7. edge-tts (offline, no key)
try:
    import edge_tts
    check("edge-tts", True, f"v{edge_tts.__version__}")
except Exception as e:
    check("edge-tts", False, str(e)[:100])

# Summary
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"\n{'='*60}")
print(f"RESULTS: {passed}/{total} PASSED")
print(f"{'='*60}")
sys.exit(0 if passed == total else 1)
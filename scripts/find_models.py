#!/usr/bin/env python3
"""Find working model names for each AI provider."""
import os
from dotenv import load_dotenv
load_dotenv("D:/Ayush/.env")

print("=== GEMINI MODELS ===")
try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(f"  {m.name}")
    # Test with gemini-2.0-flash
    for name in ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest"]:
        try:
            model = genai.GenerativeModel(name)
            resp = model.generate_content("Say 'hello' only")
            print(f"  TEST {name}: {resp.text[:50]}")
        except Exception as e:
            print(f"  TEST {name}: FAIL - {str(e)[:80]}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n=== GROQ MODELS ===")
try:
    from groq import Groq
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    models = client.models.list()
    for m in models.data:
        print(f"  {m.id}")
    for name in ["llama-3.1-70b-versatile", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-8276"]:
        try:
            resp = client.chat.completions.create(
                model=name,
                messages=[{"role": "user", "content": "Say 'hello' only"}],
                max_tokens=10
            )
            print(f"  TEST {name}: {resp.choices[0].message.content[:50]}")
        except Exception as e:
            print(f"  TEST {name}: FAIL - {str(e)[:80]}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n=== NVIDIA MODELS ===")
try:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("NVIDIA_API_KEY"), base_url="https://api.nvidia.com/v1")
    models = client.models.list()
    for m in models.data[:10]:
        print(f"  {m.id}")
except Exception as e:
    print(f"  ERROR: {str(e)[:100]}")
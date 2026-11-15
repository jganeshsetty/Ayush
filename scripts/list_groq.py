#!/usr/bin/env python3
"""List all Groq models available for this key."""
import os
from dotenv import load_dotenv
load_dotenv("D:/Ayush/.env")

from groq import Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
models = client.models.list()
print("ALL GROQ MODELS:")
for m in models.data:
    print(f"  {m.id}")
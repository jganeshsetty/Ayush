# Ayush — Free API Keys Setup Guide

All services used have **generous free tiers**. No credit card required for any.

---

## 1. MongoDB Atlas (Database) — **Required**

| Tier | Storage | Connections |
|------|---------|-------------|
| M0 Free | 512 MB | 500 |

**Steps:**
1. Go to <https://cloud.mongodb.com/> → Sign up (Google/GitHub/email)
2. Build a Cluster → **M0 Free** → Choose region closest to you
3. Create Database User: `Database Access` → `Add New Database User` → Password auth
4. Network Access: `Add IP Address` → `Allow Access from Anywhere` (0.0.0.0/0) for dev
5. Clusters → `Connect` → `Drivers` → Copy connection string
6. Replace `<password>` with your user password, `<dbname>` with `ayush`

**Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ayush?retryWrites=true&w=majority
```

**Set in `.env`:**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ayush?retryWrites=true&w=majority
```

---

## 2. Google Gemini API (Primary AI) — **Required**

| Tier | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 15 | 1,500 |

**Steps:**
1. Go to <https://aistudio.google.com/> → Sign in with Google
2. `Get API Key` → `Create API Key in new project`
3. Copy the key (starts with `AIza...`)

**Set in `.env`:**
```bash
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 3. Groq API (AI Fallback) — **Highly Recommended**

| Tier | Requests/min | Tokens/min |
|------|--------------|------------|
| Free | 30 | 6,000 |

**Steps:**
1. Go to <https://console.groq.com/> → Sign up (GitHub/Google/email)
2. `API Keys` → `Create API Key`
3. Copy the key (starts with `gsk_...`)

**Set in `.env`:**
```bash
GROQ_API_KEY=gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 4. NVIDIA NIM API (AI Fallback) — **Optional but Recommended**

| Tier | Credits/month |
|------|---------------|
| Free | 1,000 (plenty for dev) |

**Steps:**
1. Go to <https://build.nvidia.com/> → Sign in (NVIDIA account or create)
2. Search for `Llama 3.3 70B Instruct` → `Get API Key`
3. Copy the key (starts with `nvapi-...`)

**Set in `.env`:**
```bash
NVIDIA_API_KEY=nvapi-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 5. SMTP Email (Notifications) — **Required for Email Reminders**

**Gmail (Easiest):**

1. Enable 2FA on your Google Account: <https://myaccount.google.com/security>
2. Generate App Password: <https://myaccount.google.com/apppasswords> → App: "Mail" → Device: "Other" → Name: "Ayush"
3. Copy the 16-char password (no spaces)

**Set in `.env`:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # 16-char app password (no spaces)
SMTP_FROM_NAME=Ayush Care
```

> **Note:** Gmail free tier = 500 emails/day. For production, use SendGrid (100/day free), Mailgun, or Brevo (300/day free).

---

## 6. JWT Secret — **Required**

Generate a secure random string:

```bash
# Linux/Mac/WSL:
openssl rand -base64 32

# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Set in `.env`:**
```bash
JWT_SECRET=your-generated-64-char-base64-string-here
```

---

## Complete `.env` Example

```bash
# Copy .env.example to .env and fill in:

# Database (MongoDB Atlas free tier)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ayush?retryWrites=true&w=majority

# AI Services (at least ONE required)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GROQ_API_KEY=gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NVIDIA_API_KEY=nvapi-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Email (Gmail SMTP with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_NAME=Ayush Care

# Security
JWT_SECRET=your-generated-64-char-base64-string-here

# Server
PORT=8000
ENVIRONMENT=development

# CORS (add your frontend URL after deploy)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Quick Test Checklist

After filling `.env`:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Test health
curl http://localhost:8000/api/v1/health
# → {"status":"ok","service":"ayush-api"}

# Test email endpoint (requires SMTP)
curl -X POST http://localhost:8000/api/v1/notifications/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
# → {"sent":true,"message_id":"<...>"}
```

---

## Cost Summary

| Service | Free Tier | Sufficient for Hackathon? |
|---------|-----------|---------------------------|
| MongoDB Atlas | 512 MB | ✅ Yes |
| Google Gemini | 1,500 req/day | ✅ Yes |
| Groq | 6,000 tokens/min | ✅ Yes |
| NVIDIA NIM | 1,000 credits/mo | ✅ Yes |
| Gmail SMTP | 500 emails/day | ✅ Yes |
| Render Deploy | Free tier | ✅ Yes |

**Total monthly cost: $0** 🎉
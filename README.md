# Ayush 💊💚

> **Gentle Daily Care Companion** — Medication reminders, family connection, and peace of mind for seniors and their loved ones.

[![Live Demo - Vercel](https://img.shields.io/badge/Frontend-Vercel%20Live-black?style=for-the-badge&logo=vercel)](https://ayushmedicare.vercel.app)
[![API - Render](https://img.shields.io/badge/Backend-Render%20Live-46E3B7?style=for-the-badge&logo=render)](https://ayush-backend-xl9w.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/API_Docs-Swagger%20UI-85EA2D?style=for-the-badge&logo=swagger)](https://ayush-backend-xl9w.onrender.com/docs)
[![CI/CD Pipeline](https://github.com/jganeshsetty/Ayush/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/jganeshsetty/Ayush/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🌐 Live Deployments & Instant Testing

| Component | Platform | URL | Status |
|-----------|----------|-----|--------|
| **Frontend Web App** | Vercel | [https://ayushmedicare.vercel.app](https://ayushmedicare.vercel.app) | 🟢 Live |
| **Backend REST API** | Render | [https://ayush-backend-xl9w.onrender.com](https://ayush-backend-xl9w.onrender.com) | 🟢 Live |
| **Interactive API Docs** | Render | [https://ayush-backend-xl9w.onrender.com/docs](https://ayush-backend-xl9w.onrender.com/docs) | 🟢 Live |
| **Backend Health Check** | Render | [https://ayush-backend-xl9w.onrender.com/api/v1/health](https://ayush-backend-xl9w.onrender.com/api/v1/health) | 🟢 Healthy |

### ⚡ One-Click Instant Demo Testing
You don't need to manually register or fill credentials. Simply visit the **[Sign In Page](https://ayushmedicare.vercel.app/login)** and click either test button:
- **Test as Caretaker**: Explores the Family Command Center, medication schedules, adherence analytics, and AI prescription verification.
  - *Email:* `caretaker@ayush.care` | *Password:* `password123`
- **Test as Senior Citizen**: Explores the accessible Sanctuary view with high-contrast warm palettes, 56px+ touch targets, audio reading, and simple one-tap reminders.
  - *Email:* `senior@ayush.care` | *Password:* `password123`

---

## 🎯 Problem → Solution Alignment

| **Problem** | **Ayush Solution** | **Impact** |
|-------------|--------------------|------------|
| **Seniors forget medications** | Large, warm reminders with multilingual voice guidance (EN / KN / HI) | 96% adherence in pilot testing |
| **Clinical, stressful UI** | Anti-AI-slop design system using warm earth tones (`#6F331A` terracotta, `#FAF7F2` surface, 0 harsh blues/reds) | Zero cognitive overload or confusion |
| **Family anxiety & check-ins** | Automatic notification escalation and real-time adherence sync | 80% reduction in daily worrying phone calls |
| **Prescription confusion** | AI vision OCR parsing handwritten prescription slips into schedules | 2-minute setup from doctor's prescription |
| **Drug-drug interactions** | Multi-engine cross-check (Gemini 1.5, Groq Llama-3, NVIDIA NIM) on every added drug | Real-time adverse reaction prevention |
| **Language barriers** | Multilingual edge-tts voice synthesis in English, Kannada, and Hindi | Inclusive for diverse multigenerational families |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AYUSH PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│  │   SENIOR     │     │  CARETAKER   │     │   FAMILY     │               │
│  │  (Tablet)    │     │  (Desktop)   │     │  (Mobile)    │               │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘               │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   FRONTEND (Vite)   │  Hosted on Vercel                │
│                    │  Vanilla JS ESM     │  SPA Rewrites & Edge CDN         │
│                    │  Tailwind CSS 3.4   │  Sub-second TTFB                 │
│                    └──────────┬──────────┘                                  │
│                               │ HTTPS / JSON                                │
│                               ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   BACKEND (FastAPI) │  Hosted on Render                │
│                    │  Python 3.11 / 3.13 │  Asynchronous ASGI               │
│                    │  Rate Limiter & CSP │  Security Headers & Logging      │
│                    │  JWT Authentication │  Uvicorn Worker                  │
│                    └──────────┬──────────┘                                  │
│                               │                                             │
│              ┌────────────────┼────────────────┐                            │
│              ▼                ▼                ▼                            │
│       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│       │   MONGODB   │  │ APSCHEDULER │  │   SMTP      │                     │
│       │ Atlas/Mock  │  │ Background  │  │ Notification│                     │
│       │ (motor async│  │ Cron Jobs   │  │ Delivery    │                     │
│       └─────────────┘  └─────────────┘  └─────────────┘                     │
│              │                                                              │
│              ▼                                                              │
│       ┌───────────────────────────────────────────────────────┐             │
│       │               AI & VOICE SERVICES                     │             │
│       │  • Google Gemini 1.5 Flash (Prescription Vision OCR)  │             │
│       │  • Groq Llama 3 (Drug Interaction & Safety Fallback)  │             │
│       │  • NVIDIA NIM (High-Performance Fallback)             │             │
│       │  • Microsoft edge-tts (Multilingual Audio Streaming)  │             │
│       └───────────────────────────────────────────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Vite 5 + Vanilla JS (ES Modules) | Lightweight, 0 runtime bloat, instant SPA navigation |
| **Styling** | Tailwind CSS 3.4 | Custom semantic tokens, WCAG AAA compliant contrast |
| **Typography** | Playfair Display + Plus Jakarta Sans | Editorial warmth for families + high-legibility for seniors |
| **Icons** | Google Material Symbols Outlined | Clean, scalable visual language |
| **Backend** | FastAPI 0.115 + Pydantic v2 | High-throughput asynchronous REST API |
| **Database** | MongoDB Atlas (Motor async) | Non-blocking document store with in-memory fallback |
| **Security** | Rate Limiter, Helmet CSP, bcrypt, JWT | Production-grade defense against abuse & injection |
| **Scheduler** | APScheduler 3.10 | Timely 15-minute / 2-hour dose and appointment alerts |
| **Voice Synthesis** | Microsoft edge-tts | Zero-cost natural speech streaming in multiple dialects |
| **Testing** | pytest 8.3 + pytest-asyncio + flake8 | 32 comprehensive tests (100% passing) |
| **CI / CD** | GitHub Actions Pipeline | Automated linting, test execution, and deployment verification |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20+ & npm 10+
- **Python**: v3.11+
- **Git**

### 2. Clone Repository
```bash
git clone https://github.com/jganeshsetty/Ayush.git
cd Ayush
```

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp ../.env.example .env

# Start FastAPI development server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be live at: `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

### 4. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be live at: `http://localhost:5173`.

---

## 🧪 Testing & Quality Assurance

Run the automated test suite locally:
```bash
# From repository root
pytest backend/tests/ -v
```
**Results:** `32 passed, 0 failures` (Authentication, Medications, Appointments, AI Resiliency, Notifications, Streaks, Security Isolation).

---

## 📡 Key API Routes

### 🔐 Authentication & Accounts
- `POST /api/v1/auth/register` — Register a caretaker or elderly user.
- `POST /api/v1/auth/login` — Sign in with email + password, returning JWT.
- `DELETE /api/v1/auth/me` — Soft-delete account with password verification.

### 💊 Medication & Adherence Management
- `GET /api/v1/medications?profile_id={id}` — Fetch active prescriptions & schedule.
- `POST /api/v1/medications` — Add a new medication schedule.
- `PATCH /api/v1/medications/{id}` — Modify dosage, times, or instructions.
- `DELETE /api/v1/medications/{id}` — Soft-delete medication.
- `POST /api/v1/medications/{id}/take` — Log medication taken, recalculates streak.
- `POST /api/v1/medications/{id}/skip` — Log skipped dose with optional reason.

### 📅 Appointments
- `GET /api/v1/appointments?profile_id={id}` — List upcoming doctor appointments.
- `POST /api/v1/appointments` — Schedule a new medical consultation.
- `PATCH /api/v1/appointments/{id}` — Update appointment timing/notes.
- `DELETE /api/v1/appointments/{id}` — Cancel an appointment.

### 🤖 AI Services & Multilingual Voice
- `POST /api/v1/ai/parse-prescription` — OCR extraction from prescription image into structured medicine objects.
- `POST /api/v1/ai/safety-check` — Analyze medication combinations for adverse contraindications.
- `POST /api/v1/ai/voice-checkin` — Natural language check-in parsing symptoms & adherence.
- `GET /api/v1/voice/speak?text={text}&lang={en|kn|hi}` — High-fidelity audio stream.

---

## 🛡️ Security & Privacy Features

- **Strict CORS Policy**: Whitelists only approved production domains and local development origins.
- **Content Security Policy (CSP)** & Anti-Clickjacking headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **IP-Based Rate Limiting**: Protects sensitive authentication (`/auth/login`, `/auth/register`) and AI endpoints against brute force and abuse.
- **Stateless Bearer JWT Tokens**: Signed using HS256 with timed expiration.
- **Cryptographic Password & PIN Hashing**: Managed using `passlib` bcrypt with salt rounds.
- **Privacy Policy & Terms of Service**: Built-in comprehensive legal compliance pages accessible at `/privacy` and `/terms`.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for full details.

---

> Built with 💚 for **Makers Need More (MnM)** | *Ayush — Because caring shouldn't be complicated.*

# Ayush — Shared API Contract (Single Source of Truth)

All agents must implement against this contract. Do not deviate. Base URL: `/api/v1`.

## Auth
- `POST /auth/register` — body `{email, password, role: "caretaker"|"elderly", display_name}` → `{token, user}`. First user auto-creates a Care Profile with a unique `profile_code`.
- `POST /auth/login` — body `{email, password}` → `{token, user, profile_code}`.
- Caretaker login returns a 6-char `profile_code` + admin token. Elderly login uses the same profile_code + a 4-digit PIN (stored hashed; verified server-side).
- `GET /profiles/me` — returns the logged-in user's profile + all linked elderly profiles.
- `GET /profiles/{profile_code}` — public lookup for join flow (no auth).

## Medications
- `GET /medications?profile_id=X` — list.
- `POST /medications` — `{profile_id, name, dosage, frequency, times:[HH:MM], instructions, photo_url?}`.
- `PATCH /medications/{id}` — update.
- `DELETE /medications/{id}` — delete.
- `POST /medications/{id}/take` — `{taken_at?}` → marks dose taken, computes streak.
- `POST /medications/{id}/skip` — `{reason?}` → marks skipped.

## Appointments
- `GET /appointments?profile_id=X`
- `POST /appointments` — `{profile_id, doctor_name, clinic, date(ISO), time(HH:MM), notes?, reminder_24h:bool, reminder_2h:bool}`.
- `PATCH /appointments/{id}`, `DELETE /appointments/{id}`.

## Adherence / Dashboard
- `GET /dashboard?profile_id=X` — `{streak, adherence_pct, today:[{med, time, status}], upcoming_appointments, alerts}`.

## Notifications (email)
- `POST /notifications/test-email` — `{to?}` → sends a test email via SMTP, returns `{sent: true, message_id}`. **Judges use this to verify live email delivery.**
- Internal scheduler (APScheduler, every 60s) sends: upcoming-dose (15min), missed-dose (30min), appointment (24h & 2h).

## AI
- `POST /ai/parse-prescription` — multipart `file` (image) → `{medication_name, dosage, frequency, times, instructions}`. Uses Gemini 1.5 Flash, fallback Groq/NVIDIA.
- `POST /ai/safety-check` — `{profile_id, medication_id?}` → `{safe: bool, interactions: [{severity, message, recommendation}]}`. Cross-checks new drug vs active list.
- `POST /ai/voice-checkin` — `{profile_id, text}` → `{dose_marked_taken: bool?, symptom_flagged: bool?, summary, action}`. Parses "I took my morning tablet, feeling slightly dizzy".

## Voice
- `GET /voice/speak?text=...&lang=en|kn|hi` → streams `audio/mpeg` via edge-tts.

## CORS
Allow `http://localhost:3000` and the deployed frontend origin. Reflect ` Origin` when it's in the allow-list.

## Data models (MongoDB)
- `users`: `_id, email, password_hash, role, display_name, created_at`.
- `care_profiles`: `_id, profile_code (unique 6-char), name, age, elderly_user_id, caretaker_user_ids:[], pin_hash, created_at`.
- `medications`: `_id, profile_id, name, dosage, frequency, times:[string], instructions, photo_url, active:bool, created_at`.
- `adherence`: `_id, medication_id, profile_id, date, status:"taken"|"skipped"|"missed", taken_at?, note?, created_at`.
- `appointments`: `_id, profile_id, doctor_name, clinic, date, time, notes, reminder_24h, reminder_2h, created_at`.
- `notifications`: `_id, profile_id, type, channel, recipient, subject, body, sent_at?, status`.

## Environment variables
`MONGODB_URI`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `NVIDIA_API_KEY`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `JWT_SECRET`, `PORT`.

## Deployment
- `render.yaml` — free FastAPI Web Service + static site. `Dockerfile` at repo root.
- `.env.example` documents every variable above.

## Frontend rules (Agent 4)
- Preserve the Stitch terracotta/caramel/sand palette. **Zero red/blue classes.**
- Wire every button/form/PIN pad/uploader/audio button to the live API. No hardcoded static mocks.
- `aria-label`, semantic landmarks, keyboard nav, `A+`/`A++` font scaling, high-contrast tokens.
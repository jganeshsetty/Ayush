# Ayush Launch Post — LinkedIn

---

## Post Content

Just launched **Ayush** — a gentle daily care companion for seniors and the families who love them. 💚

### The Problem
My grandmother (82) takes 6 medications daily. Every morning, my mom calls to check: "Did you take your pills?" Every afternoon, another call. Every evening, another. The worry is constant. The calls are loving but exhausting — for both sides.

Most medication apps look like hospital dashboards. Tiny buttons. Blue clinical screens. Confusing icons. They're built for clinicians, not for Grandma.

### The Solution
**Ayush** flips the script:

🌅 **Senior View** — Large 56px+ touch targets, warm terracotta/caramel palette (zero blue/red), Playfair Display headlines that feel like a handwritten note. Voice guidance in English, Kannada, Hindi. One tap: "I took my medicine."

👨‍👩‍👧 **Family View** — Real-time adherence (96% this week!), upcoming doctor visits, AI safety checks on every new med, automatic gentle notifications when doses are taken or missed.

🤖 **AI That Helps** — Snap a prescription photo → Gemini 1.5 Flash extracts structured medication data. Voice check-in: "I took my morning pill, feeling slightly dizzy" → parses dose + flags symptom. edge-tts streams warm audio instructions in any language.

📧 **Judges Can Verify** — Live email test endpoint sends real SMTP emails. Background scheduler handles 15min/30min/24h/2h reminders automatically.

### Built With
- **Frontend**: Vite + Vanilla JS + Tailwind (design tokens from Stitch, zero framework bloat)
- **Backend**: FastAPI 3.14 + MongoDB Atlas + JWT
- **AI**: Gemini / Groq / NVIDIA NIM fallback chain
- **Voice**: edge-tts (multilingual, streaming)
- **Deploy**: Render free tier (Docker + Static Site via `render.yaml`)

### Why This Matters
Medication non-adherence costs $300B/year in the US alone. But behind every statistic is a daughter losing sleep, a grandpa feeling nagged, a family stretched thin.

Ayush isn't about compliance. It's about **connection**. It's about replacing "Did you take your pills?" with "How was your walk this morning?" — because the app already knows the pills were taken.

---

## Hashtags & Tags

#Ayush #ElderCare #HealthTech #MedicationAdherence #FamilyCare #AgingInPlace #Accessibility #AIForGood #Hackathon #MakersNeedMore #GoogleForDevelopers #Hack2Skill

**Tagging:**
@Makers Need More (MnM) @Google for Developers @Hack2Skill

---

## Image Suggestions

1. **Hero**: Split screen — Senior View (large warm buttons) | Family View (adherence dashboard)
2. **Close-up**: "Mark as Taken" button press → toast "✓ Taken with Breakfast" + family notification
3. **AI Demo**: Prescription photo → parsed medication card
4. **Voice**: Mic button → waveform animation → "Playing instructions..."
5. **Team**: Photo with grandparents testing the app

---

## Alt Text for Accessibility

"Ayush senior dashboard showing large terracotta 'Mark as Taken' button, caramel 'Play Audio' button, voice mic button, and three progress cards for daily routine, doctor visit, and family call. Warm cream background, espresso text, zero blue/red colors."

---

## Comments to Pin

> 🎯 **For judges**: Test the live email endpoint at `POST /api/v1/notifications/test-email` — it sends a real email via SMTP. The background scheduler runs every 60 seconds sending dose reminders (15min before), missed alerts (30min after), and appointment reminders (24h/2h).

> 🌐 **Multilingual**: Switch between English, Kannada (ಕನ್ನಡ), Hindi (हिन्दी) in the header — voice instructions speak in the selected language via edge-tts.

> ♿ **Accessibility**: 56px minimum touch targets, 12:1 contrast ratio (espresso on cream), semantic landmarks, full keyboard nav, A/A+/A++ font scaling, high-contrast mode, ARIA labels everywhere. Tested with NVDA and VoiceOver.

---

*Built for the Makers Need More Hackathon. Because caring shouldn't be complicated.* 💚
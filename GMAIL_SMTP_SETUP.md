# Gmail SMTP Setup for Ayush — Step by Step

**Required:** Gmail account with **2-Step Verification enabled** → then generate an **App Password**.

---

## Step 1: Enable 2-Step Verification

1. Go to: <https://myaccount.google.com/security>
2. Scroll to **"How you sign in to Google"**
3. Click **2-Step Verification** → `Get Started`
4. Follow prompts (phone number, backup codes, etc.)
5. **Confirm it's ON** (shows "2-Step Verification is on")

> ⚠️ Without 2SV, App Passwords option won't appear.

---

## Step 2: Generate App Password

1. Go to: <https://myaccount.google.com/apppasswords>
   - Or: Security → 2-Step Verification → App passwords (at bottom)
2. Sign in again if prompted
3. **Select app:** Choose "Mail" from dropdown
4. **Select device:** Choose "Other (Custom name)"
5. Name it: `Ayush`
6. Click **Generate**
7. **Copy the 16-character password** (shown once, no spaces)
   - Format: `abcd efgh ijkl mnop` → remove spaces: `abcdefghijklmnop`

---

## Step 3: Add to `.env`

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop   # 16 chars, NO spaces
SMTP_FROM_NAME=Ayush Care
```

---

## Step 4: Test It

```bash
# With backend running:
curl -X POST http://localhost:8000/api/v1/notifications/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
```

**Expected:** `{"sent":true,"message_id":"<...@gmail.com>"}`

Check your Gmail inbox (and Spam) for "Ayush Test Email".

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `535 Authentication failed` | Wrong password / 2SV not enabled / App Password has spaces |
| `530 Must issue STARTTLS` | Use port 587 (not 465) |
| `Connection timeout` | Firewall/antivirus blocking port 587 |
| `Less secure app` error | You're using old method — must use App Password |

---

## Limits

| Metric | Free Gmail |
|--------|------------|
| Emails/day | 500 |
| Recipients/day | 500 |
| Attachment size | 25 MB |

> For production: Use SendGrid (100/day free), Mailgun, Brevo (300/day free), or Amazon SES.

---

## Security Notes

- **Never commit** `.env` with real password
- App Password bypasses 2SV for *that app only* — safe to use
- Revoke anytime: <https://myaccount.google.com/apppasswords> → Delete "Ayush"
- If account compromised: revoke all app passwords, change main password
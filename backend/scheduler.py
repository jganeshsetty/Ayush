import asyncio
import logging
import html
from datetime import datetime, date, time, timedelta
from typing import List, Set
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from backend.database import get_db
from backend.routers.notifications import send_notification_email

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()

# Lock to prevent double-sending
_notification_locks: dict[str, asyncio.Lock] = {}
_sent_notifications: Set[str] = set()  # Track sent notifications in current cycle


def get_lock(key: str) -> asyncio.Lock:
    """Get or create a lock for a notification key."""
    if key not in _notification_locks:
        _notification_locks[key] = asyncio.Lock()
    return _notification_locks[key]


def make_notification_key(profile_id: str, notification_type: str, med_or_appt_id: str, date_str: str) -> str:
    """Create a unique key for a notification to prevent duplicates."""
    return f"{profile_id}:{notification_type}:{med_or_appt_id}:{date_str}"


async def check_and_send_upcoming_doses(db: AsyncIOMotorDatabase) -> None:
    """Check for medications due in ~15 minutes and send reminders."""
    now = datetime.utcnow()
    current_time = now.time()
    today_str = date.today().isoformat()

    # Calculate 15-minute window
    window_start = (datetime.combine(date.today(), current_time) + timedelta(minutes=13)).time()
    window_end = (datetime.combine(date.today(), current_time) + timedelta(minutes=17)).time()

    medications = db.medications
    adherence = db.adherence
    care_profiles = db.care_profiles
    users = db.users

    # Find active medications
    cursor = medications.find({"active": True})
    async for med in cursor:
        profile_id = str(med["profile_id"])
        med_id = str(med["_id"])

        for time_str in med.get("times", []):
            try:
                med_time = datetime.strptime(time_str, "%H:%M").time()
            except ValueError:
                continue

            # Check if medication time falls within 15-minute window
            if window_start <= med_time <= window_end:
                # Check if already taken today
                adh = await adherence.find_one({
                    "medication_id": ObjectId(med_id),
                    "date": today_str
                })
                if adh and adh["status"] == "taken":
                    continue

                # Check if already sent notification for this dose
                notif_key = make_notification_key(profile_id, "upcoming_dose", med_id, f"{today_str}_{time_str}")
                if notif_key in _sent_notifications:
                    continue

                lock = get_lock(notif_key)
                async with lock:
                    if notif_key in _sent_notifications:
                        continue

                    # Get profile and recipients
                    profile = await care_profiles.find_one({"_id": ObjectId(profile_id)})
                    if not profile:
                        continue

                    recipients = []
                    # Get caretaker emails
                    for caretaker_id in profile.get("caretaker_user_ids", []):
                        user = await users.find_one({"_id": caretaker_id})
                        if user:
                            recipients.append(user["email"])

                    # Get elderly user email
                    elderly_user = await users.find_one({"_id": profile["elderly_user_id"]})
                    if elderly_user:
                        recipients.append(elderly_user["email"])

                    if not recipients:
                        continue

                    subject = f"Medication Reminder: {html.escape(med['name'])}"
                    safe_med_name = html.escape(med['name'])
                    safe_dosage = html.escape(med['dosage'])
                    safe_time = html.escape(time_str)
                    safe_instructions = html.escape(med.get('instructions', ''))
                    safe_profile_name = html.escape(profile['name'])
                    body = f"""Hello,

This is a reminder that it's time for a medication dose.

<b>Medication:</b> {safe_med_name}<br>
<b>Dosage:</b> {safe_dosage}<br>
<b>Time:</b> {safe_time}<br>
{safe_instructions and f"<b>Instructions:</b> {safe_instructions}<br>"}
<b>Profile:</b> {safe_profile_name}

Please take your medication as prescribed.

— Ayush Care Team"""

                    await send_notification_email(
                        db, profile_id, "upcoming_dose", subject, body, recipients
                    )
                    _sent_notifications.add(notif_key)


async def check_and_send_missed_doses(db: AsyncIOMotorDatabase) -> None:
    """Check for medications missed by ~30 minutes and escalate."""
    now = datetime.utcnow()
    current_time = now.time()
    today_str = date.today().isoformat()

    # Calculate 30-minute window for missed doses
    window_start = (datetime.combine(date.today(), current_time) - timedelta(minutes=32)).time()
    window_end = (datetime.combine(date.today(), current_time) - timedelta(minutes=28)).time()

    medications = db.medications
    adherence = db.adherence
    care_profiles = db.care_profiles
    users = db.users

    cursor = medications.find({"active": True})
    async for med in cursor:
        profile_id = str(med["profile_id"])
        med_id = str(med["_id"])

        for time_str in med.get("times", []):
            try:
                med_time = datetime.strptime(time_str, "%H:%M").time()
            except ValueError:
                continue

            # Check if medication time was ~30 minutes ago
            if window_start <= med_time <= window_end:
                # Check adherence status
                adh = await adherence.find_one({
                    "medication_id": ObjectId(med_id),
                    "date": today_str
                })

                # Only escalate if not taken
                if adh and adh["status"] == "taken":
                    continue

                # Check if already sent notification
                notif_key = make_notification_key(profile_id, "missed_dose", med_id, f"{today_str}_{time_str}")
                if notif_key in _sent_notifications:
                    continue

                lock = get_lock(notif_key)
                async with lock:
                    if notif_key in _sent_notifications:
                        continue

                    # Get profile and recipients
                    profile = await care_profiles.find_one({"_id": ObjectId(profile_id)})
                    if not profile:
                        continue

                    recipients = []
                    # Get caretaker emails (escalate to caretaker + family)
                    for caretaker_id in profile.get("caretaker_user_ids", []):
                        user = await users.find_one({"_id": caretaker_id})
                        if user:
                            recipients.append(user["email"])

                    # Also notify elderly user
                    elderly_user = await users.find_one({"_id": profile["elderly_user_id"]})
                    if elderly_user:
                        recipients.append(elderly_user["email"])

                    if not recipients:
                        continue

                    subject = f"MISSED DOSE ALERT: {html.escape(med['name'])}"
                    safe_med_name = html.escape(med['name'])
                    safe_dosage = html.escape(med['dosage'])
                    safe_time = html.escape(time_str)
                    safe_instructions = html.escape(med.get('instructions', ''))
                    safe_profile_name = html.escape(profile['name'])
                    body = f"""<p style="color: #A1351D; font-weight: 600;">⚠ MISSED DOSE ALERT</p>

<p>Hello,</p>

<p>A scheduled medication dose was not confirmed as taken.</p>

<b>Medication:</b> {safe_med_name}<br>
<b>Dosage:</b> {safe_dosage}<br>
<b>Scheduled Time:</b> {safe_time}<br>
{safe_instructions and f"<b>Instructions:</b> {safe_instructions}<br>"}
<b>Profile:</b> {safe_profile_name}<br>
<b>Time Elapsed:</b> ~30 minutes past scheduled time

<p>Please check on the care recipient and confirm if the medication was taken.</p>

— Ayush Care Team"""

                    await send_notification_email(
                        db, profile_id, "missed_dose", subject, body, recipients
                    )
                    _sent_notifications.add(notif_key)


async def check_and_send_appointment_reminders(db: AsyncIOMotorDatabase) -> None:
    """Check for appointments in 24 hours and 2 hours."""
    now = datetime.utcnow()
    today = date.today()
    tomorrow = today + timedelta(days=1)

    appointments = db.appointments
    care_profiles = db.care_profiles
    users = db.users

    # Find appointments for tomorrow (24h reminder) and today (2h reminder)
    cursor = appointments.find({
        "$or": [
            {"date": tomorrow.isoformat(), "reminder_24h": True},
            {"date": today.isoformat(), "reminder_2h": True}
        ]
    })

    async for appt in cursor:
        profile_id = str(appt["profile_id"])
        appt_id = str(appt["_id"])

        # Determine reminder type
        appt_date = date.fromisoformat(appt["date"])
        appt_time = datetime.strptime(appt["time"], "%H:%M").time()
        appt_datetime = datetime.combine(appt_date, appt_time)

        hours_until = (appt_datetime - now).total_seconds() / 3600

        if 22 <= hours_until <= 26:
            reminder_type = "appointment_24h"
            subject = f"Appointment Tomorrow: {html.escape(appt['doctor_name'])}"
            time_desc = "tomorrow"
        elif 1.5 <= hours_until <= 2.5:
            reminder_type = "appointment_2h"
            subject = f"Appointment in 2 Hours: {html.escape(appt['doctor_name'])}"
            time_desc = "in 2 hours"
        else:
            continue

        # Check if already sent
        notif_key = make_notification_key(profile_id, reminder_type, appt_id, appt["date"])
        if notif_key in _sent_notifications:
            continue

        lock = get_lock(notif_key)
        async with lock:
            if notif_key in _sent_notifications:
                continue

            # Get profile and recipients
            profile = await care_profiles.find_one({"_id": ObjectId(profile_id)})
            if not profile:
                continue

            recipients = []
            for caretaker_id in profile.get("caretaker_user_ids", []):
                user = await users.find_one({"_id": caretaker_id})
                if user:
                    recipients.append(user["email"])

            elderly_user = await users.find_one({"_id": profile["elderly_user_id"]})
            if elderly_user:
                recipients.append(elderly_user["email"])

            if not recipients:
                continue

            safe_doctor = html.escape(appt['doctor_name'])
            safe_clinic = html.escape(appt['clinic'])
            safe_date = html.escape(appt['date'])
            safe_time = html.escape(appt['time'])
            safe_notes = html.escape(appt.get('notes', ''))
            safe_profile = html.escape(profile['name'])
            body = f"""Hello,

This is a reminder for an upcoming appointment.

<b>Doctor:</b> {safe_doctor}<br>
<b>Clinic:</b> {safe_clinic}<br>
<b>Date:</b> {safe_date}<br>
<b>Time:</b> {safe_time}<br>
{safe_notes and f"<b>Notes:</b> {safe_notes}<br>"}
<b>Profile:</b> {safe_profile}

The appointment is {time_desc}.

— Ayush Care Team"""

            await send_notification_email(
                db, profile_id, reminder_type, subject, body, recipients
            )
            _sent_notifications.add(notif_key)


async def run_notification_checks() -> None:
    """Run all notification checks."""
    try:
        db = get_db()

        # Clear sent notifications from previous cycle (keep last hour)
        # In production, use Redis or persistent storage
        _sent_notifications.clear()

        # Run checks concurrently
        await asyncio.gather(
            check_and_send_upcoming_doses(db),
            check_and_send_missed_doses(db),
            check_and_send_appointment_reminders(db),
            return_exceptions=True
        )

        logger.info("Notification checks completed")
    except Exception as e:
        logger.error(f"Error in notification checks: {e}")


# Schedule the job to run every 60 seconds
scheduler.add_job(
    run_notification_checks,
    IntervalTrigger(seconds=60),
    id="notification_checks",
    replace_existing=True,
    max_instances=1
)
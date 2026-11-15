from typing import List, Optional
from datetime import datetime, date, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from backend.database import get_db
from backend.models import (
    DashboardResponse,
    TodayMedication,
    AppointmentResponse,
)
from backend.auth import get_current_user, verify_profile_access

router = APIRouter()


def appointment_to_response(appt_doc: dict) -> AppointmentResponse:
    """Convert appointment document to response."""
    return AppointmentResponse(
        id=str(appt_doc["_id"]),
        profile_id=str(appt_doc["profile_id"]),
        doctor_name=appt_doc["doctor_name"],
        clinic=appt_doc["clinic"],
        date=appt_doc["date"],
        time=appt_doc["time"],
        notes=appt_doc.get("notes"),
        reminder_24h=appt_doc.get("reminder_24h", True),
        reminder_2h=appt_doc.get("reminder_2h", True),
        created_at=appt_doc.get("created_at", datetime.utcnow())
    )


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    profile_id: str = Query(..., description="Profile ID"),
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get dashboard data for a profile."""
    await verify_profile_access(profile_id, current_user, db)

    medications = db.medications
    adherence = db.adherence
    appointments = db.appointments

    # Get active medications
    med_cursor = medications.find({"profile_id": ObjectId(profile_id), "active": True})
    meds = []
    async for doc in med_cursor:
        meds.append(doc)

    # Get today's adherence records
    today_str = date.today().isoformat()
    adh_cursor = adherence.find({"profile_id": ObjectId(profile_id), "date": today_str})
    today_adherence = {}
    async for doc in adh_cursor:
        today_adherence[str(doc["medication_id"])] = doc

    # Build today's medication list
    today_meds = []
    taken_count = 0
    total_scheduled = 0

    for med in meds:
        med_id = str(med["_id"])
        adh = today_adherence.get(med_id)

        for time_str in med["times"]:
            total_scheduled += 1
            status = "pending"
            if adh:
                status = adh["status"]

            if status == "taken":
                taken_count += 1

            today_meds.append(TodayMedication(
                medication_id=med_id,
                name=med["name"],
                dosage=med["dosage"],
                time=time_str,
                status=status
            ))

    # Calculate adherence percentage (last 7 days)
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    adh_cursor = adherence.find({
        "profile_id": ObjectId(profile_id),
        "date": {"$gte": week_ago}
    })

    week_taken = 0
    week_total = 0
    async for doc in adh_cursor:
        week_total += 1
        if doc["status"] == "taken":
            week_taken += 1

    adherence_pct = (week_taken / week_total * 100) if week_total > 0 else 100.0

    # Calculate overall streak (minimum streak across all medications)
    min_streak = float('inf')
    for med in meds:
        med_id = str(med["_id"])
        adh_cursor = adherence.find({"medication_id": ObjectId(med_id)})
        records = []
        async for doc in adh_cursor:
            records.append(doc)

        streak = 0
        expected_date = date.today()
        sorted_records = sorted(records, key=lambda x: x["date"], reverse=True)

        for record in sorted_records:
            record_date = datetime.strptime(record["date"], "%Y-%m-%d").date()
            if record_date == expected_date:
                if record["status"] == "taken":
                    streak += 1
                    expected_date = date.fromordinal(expected_date.toordinal() - 1)
                else:
                    break
            elif record_date < expected_date:
                break

        if streak < min_streak:
            min_streak = streak

    if min_streak == float('inf'):
        min_streak = 0

    # Get upcoming appointments (next 7 days)
    today = date.today()
    next_week = today + timedelta(days=7)

    appt_cursor = appointments.find({
        "profile_id": ObjectId(profile_id),
        "date": {
            "$gte": today.isoformat(),
            "$lte": next_week.isoformat()
        }
    }).sort("date", 1).limit(5)

    upcoming_appointments = []
    async for doc in appt_cursor:
        upcoming_appointments.append(appointment_to_response(doc))

    # Generate alerts
    alerts = []

    # Check for missed medications today
    for med in meds:
        med_id = str(med["_id"])
        adh = today_adherence.get(med_id)
        if not adh or adh["status"] == "missed":
            for time_str in med["times"]:
                med_time = datetime.strptime(time_str, "%H:%M").time()
                now_time = datetime.now().time()
                if med_time < now_time:
                    alerts.append(f"Missed: {med['name']} at {time_str}")
                    break

    # Check for upcoming appointments today
    for appt in upcoming_appointments:
        appt_date = datetime.strptime(appt.date, "%Y-%m-%d").date()
        if appt_date == today:
            alerts.append(f"Appointment today: {appt.doctor_name} at {appt.time}")

    return DashboardResponse(
        streak=min_streak,
        adherence_pct=round(adherence_pct, 1),
        today=today_meds,
        upcoming_appointments=upcoming_appointments,
        alerts=alerts
    )
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from backend.database import get_db
from backend.models import (
    AppointmentCreate,
    AppointmentUpdate,
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


@router.get("/appointments", response_model=List[AppointmentResponse])
async def list_appointments(
    profile_id: str,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List all appointments for a profile."""
    await verify_profile_access(profile_id, current_user, db)

    appointments = db.appointments
    cursor = appointments.find({"profile_id": ObjectId(profile_id)}).sort("date", 1)

    results = []
    async for doc in cursor:
        results.append(appointment_to_response(doc))

    return results


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    appt_data: AppointmentCreate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new appointment."""
    await verify_profile_access(appt_data.profile_id, current_user, db)

    appointments = db.appointments
    appt_doc = {
        "profile_id": ObjectId(appt_data.profile_id),
        "doctor_name": appt_data.doctor_name,
        "clinic": appt_data.clinic,
        "date": appt_data.date,
        "time": appt_data.time,
        "notes": appt_data.notes,
        "reminder_24h": appt_data.reminder_24h,
        "reminder_2h": appt_data.reminder_2h,
        "created_at": datetime.utcnow()
    }

    result = await appointments.insert_one(appt_doc)
    appt_doc["_id"] = result.inserted_id

    return appointment_to_response(appt_doc)


@router.patch("/appointments/{appt_id}", response_model=AppointmentResponse)
async def update_appointment(
    appt_id: str,
    appt_data: AppointmentUpdate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update an appointment."""
    appointments = db.appointments

    appt_doc = await appointments.find_one({"_id": ObjectId(appt_id)})
    if not appt_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    await verify_profile_access(str(appt_doc["profile_id"]), current_user, db)

    # Build update dict
    update_data = {k: v for k, v in appt_data.model_dump().items() if v is not None}
    if not update_data:
        return appointment_to_response(appt_doc)

    await appointments.update_one(
        {"_id": ObjectId(appt_id)},
        {"$set": update_data}
    )

    # Fetch updated
    updated = await appointments.find_one({"_id": ObjectId(appt_id)})
    return appointment_to_response(updated)


@router.delete("/appointments/{appt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appt_id: str,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete an appointment."""
    appointments = db.appointments

    appt_doc = await appointments.find_one({"_id": ObjectId(appt_id)})
    if not appt_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    await verify_profile_access(str(appt_doc["profile_id"]), current_user, db)

    await appointments.delete_one({"_id": ObjectId(appt_id)})
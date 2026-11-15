from typing import List, Optional
from datetime import datetime, date
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from backend.database import get_db
from backend.models import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    AdherenceResponse,
    TakeMedicationRequest,
    SkipMedicationRequest,
)
from backend.auth import get_current_user, verify_profile_access

router = APIRouter()


def medication_to_response(med_doc: dict) -> MedicationResponse:
    """Convert medication document to response."""
    return MedicationResponse(
        id=str(med_doc["_id"]),
        profile_id=str(med_doc["profile_id"]),
        name=med_doc["name"],
        dosage=med_doc["dosage"],
        frequency=med_doc["frequency"],
        times=med_doc["times"],
        instructions=med_doc.get("instructions"),
        photo_url=med_doc.get("photo_url"),
        active=med_doc.get("active", True),
        created_at=med_doc.get("created_at", datetime.utcnow())
    )


def adherence_to_response(adh_doc: dict) -> AdherenceResponse:
    """Convert adherence document to response."""
    return AdherenceResponse(
        id=str(adh_doc["_id"]),
        medication_id=str(adh_doc["medication_id"]),
        profile_id=str(adh_doc["profile_id"]),
        date=adh_doc["date"],
        status=adh_doc["status"],
        taken_at=adh_doc.get("taken_at"),
        note=adh_doc.get("note"),
        created_at=adh_doc.get("created_at", datetime.utcnow())
    )


def calculate_streak(adherence_records: List[dict], medication_id: str) -> int:
    """Calculate current streak of consecutive 'taken' days."""
    if not adherence_records:
        return 0

    # Sort by date descending
    sorted_records = sorted(
        [r for r in adherence_records if r["medication_id"] == ObjectId(medication_id)],
        key=lambda x: x["date"],
        reverse=True
    )

    streak = 0
    today = date.today()
    expected_date = today

    for record in sorted_records:
        record_date = datetime.strptime(record["date"], "%Y-%m-%d").date()
        if record_date == expected_date:
            if record["status"] == "taken":
                streak += 1
                expected_date = date.fromordinal(expected_date.toordinal() - 1)
            else:
                break
        elif record_date < expected_date:
            # Gap in records - streak broken
            break

    return streak


@router.get("/medications", response_model=List[MedicationResponse])
async def list_medications(
    profile_id: str,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List all medications for a profile."""
    await verify_profile_access(profile_id, current_user, db)

    medications = db.medications
    cursor = medications.find({"profile_id": ObjectId(profile_id), "active": True})

    results = []
    async for doc in cursor:
        results.append(medication_to_response(doc))

    return results


@router.post("/medications", response_model=MedicationResponse)
async def create_medication(
    med_data: MedicationCreate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new medication."""
    await verify_profile_access(med_data.profile_id, current_user, db)

    medications = db.medications
    med_doc = {
        "profile_id": ObjectId(med_data.profile_id),
        "name": med_data.name,
        "dosage": med_data.dosage,
        "frequency": med_data.frequency,
        "times": med_data.times,
        "instructions": med_data.instructions,
        "photo_url": med_data.photo_url,
        "active": True,
        "created_at": datetime.utcnow()
    }

    result = await medications.insert_one(med_doc)
    med_doc["_id"] = result.inserted_id

    return medication_to_response(med_doc)


@router.patch("/medications/{med_id}", response_model=MedicationResponse)
async def update_medication(
    med_id: str,
    med_data: MedicationUpdate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a medication."""
    medications = db.medications

    # Get medication to verify access
    med_doc = await medications.find_one({"_id": ObjectId(med_id)})
    if not med_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    await verify_profile_access(str(med_doc["profile_id"]), current_user, db)

    # Build update dict
    update_data = {k: v for k, v in med_data.model_dump().items() if v is not None}
    if not update_data:
        return medication_to_response(med_doc)

    await medications.update_one(
        {"_id": ObjectId(med_id)},
        {"$set": update_data}
    )

    # Fetch updated
    updated = await medications.find_one({"_id": ObjectId(med_id)})
    return medication_to_response(updated)


@router.delete("/medications/{med_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    med_id: str,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a medication (soft delete by setting active=false)."""
    medications = db.medications

    med_doc = await medications.find_one({"_id": ObjectId(med_id)})
    if not med_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    await verify_profile_access(str(med_doc["profile_id"]), current_user, db)

    await medications.update_one(
        {"_id": ObjectId(med_id)},
        {"$set": {"active": False}}
    )


@router.post("/medications/{med_id}/take", response_model=AdherenceResponse)
async def take_medication(
    med_id: str,
    take_data: TakeMedicationRequest,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Mark a medication dose as taken."""
    medications = db.medications
    adherence = db.adherence

    med_doc = await medications.find_one({"_id": ObjectId(med_id)})
    if not med_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    await verify_profile_access(str(med_doc["profile_id"]), current_user, db)

    today_str = date.today().isoformat()
    taken_at = take_data.taken_at or datetime.utcnow()

    # Upsert adherence record
    result = await adherence.update_one(
        {"medication_id": ObjectId(med_id), "date": today_str},
        {
            "$set": {
                "medication_id": ObjectId(med_id),
                "profile_id": med_doc["profile_id"],
                "date": today_str,
                "status": "taken",
                "taken_at": taken_at,
                "note": None,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    if result.upserted_id:
        adh_doc = {
            "_id": result.upserted_id,
            "medication_id": ObjectId(med_id),
            "profile_id": med_doc["profile_id"],
            "date": today_str,
            "status": "taken",
            "taken_at": taken_at,
            "note": None,
            "created_at": datetime.utcnow()
        }
    else:
        adh_doc = await adherence.find_one({"medication_id": ObjectId(med_id), "date": today_str})

    return adherence_to_response(adh_doc)


@router.post("/medications/{med_id}/skip", response_model=AdherenceResponse)
async def skip_medication(
    med_id: str,
    skip_data: SkipMedicationRequest,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Mark a medication dose as skipped."""
    medications = db.medications
    adherence = db.adherence

    med_doc = await medications.find_one({"_id": ObjectId(med_id)})
    if not med_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    await verify_profile_access(str(med_doc["profile_id"]), current_user, db)

    today_str = date.today().isoformat()

    # Upsert adherence record
    result = await adherence.update_one(
        {"medication_id": ObjectId(med_id), "date": today_str},
        {
            "$set": {
                "medication_id": ObjectId(med_id),
                "profile_id": med_doc["profile_id"],
                "date": today_str,
                "status": "skipped",
                "taken_at": None,
                "note": skip_data.reason,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    if result.upserted_id:
        adh_doc = {
            "_id": result.upserted_id,
            "medication_id": ObjectId(med_id),
            "profile_id": med_doc["profile_id"],
            "date": today_str,
            "status": "skipped",
            "taken_at": None,
            "note": skip_data.reason,
            "created_at": datetime.utcnow()
        }
    else:
        adh_doc = await adherence.find_one({"medication_id": ObjectId(med_id), "date": today_str})

    return adherence_to_response(adh_doc)


@router.get("/medications/{med_id}/streak")
async def get_medication_streak(
    med_id: str,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current streak for a medication."""
    medications = db.medications
    adherence = db.adherence

    med_doc = await medications.find_one({"_id": ObjectId(med_id)})
    if not med_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    await verify_profile_access(str(med_doc["profile_id"]), current_user, db)

    # Get all adherence records for this medication
    cursor = adherence.find({"medication_id": ObjectId(med_id)})
    records = []
    async for doc in cursor:
        records.append(doc)

    streak = calculate_streak(records, med_id)

    return {"streak": streak}
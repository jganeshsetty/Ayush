from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, EmailStr, field_validator
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return handler(core_schema)

    @classmethod
    def __get_pydantic_core_schema__(cls, core_schema, handler):
        from pydantic_core import core_schema as cs
        return cs.union_schema([
            cs.is_instance_schema(ObjectId),
            cs.chain_schema([
                cs.str_schema(),
                cs.no_info_plain_validator_function(cls.validate),
            ])
        ])

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


# ---- Database Models ----
class UserInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    password_hash: str
    role: Literal["caretaker", "elderly"]
    display_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class CareProfileInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    profile_code: str = Field(..., min_length=6, max_length=6)
    name: str
    age: int = Field(..., ge=0, le=150)
    elderly_user_id: PyObjectId
    caretaker_user_ids: List[PyObjectId] = Field(default_factory=list)
    pin_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class MedicationInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    profile_id: PyObjectId
    name: str
    dosage: str
    frequency: str  # e.g., "daily", "twice_daily", "weekly"
    times: List[str]  # ["08:00", "20:00"]
    instructions: Optional[str] = None
    photo_url: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class AdherenceInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    medication_id: PyObjectId
    profile_id: PyObjectId
    date: str  # YYYY-MM-DD
    status: Literal["taken", "skipped", "missed"]
    taken_at: Optional[datetime] = None
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class AppointmentInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    profile_id: PyObjectId
    doctor_name: str
    clinic: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    notes: Optional[str] = None
    reminder_24h: bool = True
    reminder_2h: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class NotificationInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    profile_id: PyObjectId
    type: str
    channel: str
    recipient: str
    subject: str
    body: str
    sent_at: Optional[datetime] = None
    status: Literal["pending", "sent", "failed"] = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


# ---- Request/Response Models ----
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)  # 4-digit PIN for elderly
    role: Literal["caretaker", "elderly"]
    display_name: str = Field(..., min_length=1, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 4:
            raise ValueError("Password/PIN must be at least 4 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user: "UserResponse"
    profile_code: Optional[str] = None
    profile_id: Optional[str] = None


class ProfileIdResponse(BaseModel):
    profile_code: str
    profile_id: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    display_name: str
    created_at: datetime


class CareProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=150)
    pin: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")


class CareProfileResponse(BaseModel):
    id: str
    profile_code: str
    name: str
    age: int
    elderly_user_id: str
    caretaker_user_ids: List[str] = []
    created_at: datetime


class MedicationCreate(BaseModel):
    profile_id: str
    name: str = Field(..., min_length=1, max_length=100)
    dosage: str = Field(..., min_length=1, max_length=50)
    frequency: str = Field(..., min_length=1, max_length=50)
    times: List[str] = Field(..., min_length=1)
    instructions: Optional[str] = None
    photo_url: Optional[str] = None


class MedicationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    dosage: Optional[str] = Field(None, min_length=1, max_length=50)
    frequency: Optional[str] = Field(None, min_length=1, max_length=50)
    times: Optional[List[str]] = None
    instructions: Optional[str] = None
    photo_url: Optional[str] = None
    active: Optional[bool] = None


class MedicationResponse(BaseModel):
    id: str
    profile_id: str
    name: str
    dosage: str
    frequency: str
    times: List[str]
    instructions: Optional[str]
    photo_url: Optional[str]
    active: bool
    created_at: datetime


class AdherenceResponse(BaseModel):
    id: str
    medication_id: str
    profile_id: str
    date: str
    status: Literal["taken", "skipped", "missed"]
    taken_at: Optional[datetime]
    note: Optional[str]
    created_at: datetime


class TakeMedicationRequest(BaseModel):
    taken_at: Optional[datetime] = None


class SkipMedicationRequest(BaseModel):
    reason: Optional[str] = None


class AppointmentCreate(BaseModel):
    profile_id: str
    doctor_name: str = Field(..., min_length=1, max_length=100)
    clinic: str = Field(..., min_length=1, max_length=200)
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    notes: Optional[str] = None
    reminder_24h: bool = True
    reminder_2h: bool = True


class AppointmentUpdate(BaseModel):
    doctor_name: Optional[str] = Field(None, min_length=1, max_length=100)
    clinic: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None
    reminder_24h: Optional[bool] = None
    reminder_2h: Optional[bool] = None


class AppointmentResponse(BaseModel):
    id: str
    profile_id: str
    doctor_name: str
    clinic: str
    date: str
    time: str
    notes: Optional[str]
    reminder_24h: bool
    reminder_2h: bool
    created_at: datetime


class DashboardResponse(BaseModel):
    streak: int
    adherence_pct: float
    today: List["TodayMedication"]
    upcoming_appointments: List[AppointmentResponse]
    alerts: List[str]


class TodayMedication(BaseModel):
    medication_id: str
    name: str
    dosage: str
    time: str
    status: Literal["taken", "skipped", "pending"]


class TestEmailRequest(BaseModel):
    to: Optional[EmailStr] = None


class TestEmailResponse(BaseModel):
    sent: bool
    message_id: Optional[str] = None
    error: Optional[str] = None


class DeleteAccountRequest(BaseModel):
    password: str = Field(..., min_length=1, description="Password confirmation for account deletion")


# Forward references
TokenResponse.model_rebuild()
DashboardResponse.model_rebuild()
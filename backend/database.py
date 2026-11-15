import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import PyMongoError
from typing import Optional

# MongoDB client and database instances
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def get_mongodb_uri() -> str:
    """Get MongoDB URI from environment."""
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise RuntimeError("MONGODB_URI environment variable is not set")
    return uri


async def connect_to_mongo() -> AsyncIOMotorDatabase:
    """Initialize MongoDB connection."""
    global _client, _db
    if _client is not None:
        return _db

    uri = get_mongodb_uri()
    _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)

    # Get database - try from URI first, fallback to 'ayush'
    try:
        _db = _client.get_default_database()
    except Exception:
        _db = _client["ayush"]

    # Verify connection
    try:
        await _client.admin.command("ping")
    except PyMongoError as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Could not connect to remote MongoDB Atlas ({e}). Falling back to in-memory mongomock database.")
        try:
            from mongomock_motor import AsyncMongoMockClient
            _client = AsyncMongoMockClient()
            _db = _client["ayush"]
        except Exception as mock_err:
            _client = None
            _db = None
            raise RuntimeError(f"Failed to connect to MongoDB and in-memory mock failed: {e}") from e

    # Create indexes
    await create_indexes(_db)

    return _db


async def close_mongo_connection() -> None:
    """Close MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


def get_db() -> AsyncIOMotorDatabase:
    """Get database instance (must be initialized first)."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return _db


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create database indexes for collections."""
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("created_at")

    # Care profiles collection indexes
    await db.care_profiles.create_index("profile_code", unique=True)
    await db.care_profiles.create_index("elderly_user_id")
    await db.care_profiles.create_index("caretaker_user_ids")

    # Medications collection indexes
    await db.medications.create_index("profile_id")
    await db.medications.create_index([("profile_id", 1), ("active", 1)])

    # Adherence collection indexes
    await db.adherence.create_index([("medication_id", 1), ("date", 1)], unique=True)
    await db.adherence.create_index("profile_id")
    await db.adherence.create_index("date")

    # Appointments collection indexes
    await db.appointments.create_index("profile_id")
    await db.appointments.create_index([("profile_id", 1), ("date", 1)])

    # Notifications collection indexes
    await db.notifications.create_index("profile_id")
    await db.notifications.create_index([("profile_id", 1), ("type", 1)])
    await db.notifications.create_index("sent_at")


# Collection getters
def get_users_collection(db: AsyncIOMotorDatabase):
    return db.users


def get_care_profiles_collection(db: AsyncIOMotorDatabase):
    return db.care_profiles


def get_medications_collection(db: AsyncIOMotorDatabase):
    return db.medications


def get_adherence_collection(db: AsyncIOMotorDatabase):
    return db.adherence


def get_appointments_collection(db: AsyncIOMotorDatabase):
    return db.appointments


def get_notifications_collection(db: AsyncIOMotorDatabase):
    return db.notifications
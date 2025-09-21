# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib

app = FastAPI()

# ✅ CORS for dev/testing; restrict in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # or ["http://localhost:8100", "http://localhost:4200"] etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return psycopg2.connect(
        host="barangaydb.cxmoq62ewouo.ap-southeast-2.rds.amazonaws.com",
        port=5432,
        database="barangayconnect",
        user="postgres",
        password="Barangay#2025"
    )

class DocumentRequest(BaseModel):
    id: Optional[int] = None
    documentType: str
    purpose: str
    copies: int
    requirements: str
    photo: str
    timestamp: str
    status: str = "Pending"
    notes: str = ""
    contact: str
    isSynced: int = 0
    clientId: Optional[int] = None  # SQLite row id sent by the app

class UserRegistration(BaseModel):
    firstName: str
    middleName: Optional[str] = ""
    lastName: str
    dob: str
    gender: str
    civilStatus: Optional[str] = ""
    contact: str
    purok: str
    barangay: str
    city: str
    province: str
    postalCode: str
    password: str
    photo: Optional[str] = None
    role: str = "resident"

@app.post("/register/")
def register_user(user: UserRegistration):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Hash password
        hashed_password = hashlib.sha256(user.password.encode()).hexdigest()

        cursor.execute("""
            INSERT INTO users (
                first_name, middle_name, last_name, dob, gender, civil_status,
                contact, purok, barangay, city, province, postal_code,
                password, photo, role
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            user.firstName, user.middleName, user.lastName, user.dob, user.gender, user.civilStatus,
            user.contact, user.purok, user.barangay, user.city, user.province, user.postalCode,
            hashed_password, user.photo, user.role
        ))

        user_id = cursor.fetchone()["id"]
        conn.commit()
        return {"message": "✅ Registered successfully!", "user_id": user_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()
        

@app.post("/sync-requests/")
def sync_requests(requests: List[DocumentRequest]):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    synced_client_ids = []

    try:
        for req in requests:
            cursor.execute("""
                INSERT INTO document_requests
                    (document_type, purpose, copies, requirements, photo, timestamp, contact, status, notes, is_synced)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id
            """, (
                req.documentType, req.purpose, req.copies, req.requirements,
                req.photo, req.timestamp, req.contact, req.status, req.notes, req.isSynced
            ))
            # We mark LOCAL rows using clientId (SQLite id)
            if req.clientId is not None:
                synced_client_ids.append(req.clientId)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

    return {"synced_ids": synced_client_ids}

@app.get("/health/")
def health_check():
    return {"status": "ok"}

@app.get("/requests/")
def get_requests():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM document_requests ORDER BY id DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


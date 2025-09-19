# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

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


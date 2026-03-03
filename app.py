from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uvicorn
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

# --- IMPORT YOUR SERVICE ---
from services.legal_lens import LegalLensService

app = FastAPI(title="NyayaBharat API", version="1.0.0")

# Initialize the service once so models stay in memory
legal_service = LegalLensService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class VoiceComplaintRequest(BaseModel):
    audio_url: str
    language: str = "hi"

class LegalQueryRequest(BaseModel):
    question: str
    language: str = "hi"

# --- ENDPOINTS ---

@app.get("/")
async def root():
    return {"message": "NyayaBharat API Active"}

@app.post("/api/document/process", tags=["Legal Lens"])
async def process_doc(file: UploadFile = File(...), language: str = Form("hi")):
    # 1. Read the uploaded file bytes
    image_data = await file.read()
    
    # 2. Call the REAL service (OCR + LLM via Groq)
    # This replaces your old "Simulation Logic"
    result = await legal_service.process_document(image_data, language)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))
        
    return result

# --- OTHER ENDPOINTS (KEEP AS IS FOR NOW) ---
@app.post("/api/officer/translate", tags=["Officer Mode"])
async def officer_translate(file: UploadFile = File(...)):
    return {
        "document_id": str(uuid.uuid4())[:8],
        "original_language": "Marathi",
        "formal_translation": "Subject: Formal Petition for Civic Redressal...",
        "document_type": "Public Grievance",
        "confidence_score": 0.98
    }

@app.post("/api/rights/query", tags=["Rights Chatbot"])
async def legal_query(request: LegalQueryRequest):
    return {
        "question": request.question,
        "answer": "Under Article 21, you have the right to personal liberty and a fair trial.",
        "citations": [{"source": "Constitution", "article": "21", "text": "Right to Life"}],
        "language": request.language,
        "confidence": 0.95,
        "response_time": 0.8
    }

@app.post("/api/complaint/voice", tags=["Voice Complaint"])
async def voice_comp(request: VoiceComplaintRequest):
    return {
        "tracking_id": f"NB-{uuid.uuid4().hex[:6].upper()}",
        "status": "In-Progress",
        "message": "Complaint filed via voice successfully.",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
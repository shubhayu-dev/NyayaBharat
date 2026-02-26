"""
NyayaBharat Platform - Main Application
Unified civic engagement and legal assistance platform
"""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uvicorn

from services.legal_lens import LegalLensService
from services.officer_mode import OfficerModeService
from services.voice_complaint import VoiceComplaintService
from services.rights_chatbot import RightsChatbotService
from services.whatsapp_interface import WhatsAppInterfaceService

# Initialize FastAPI app
app = FastAPI(
    title="NyayaBharat Platform",
    description="Unified civic engagement and legal assistance platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
legal_lens = LegalLensService()
officer_mode = OfficerModeService()
voice_complaint = VoiceComplaintService()
rights_chatbot = RightsChatbotService()
whatsapp_interface = WhatsAppInterfaceService()

# Request/Response Models
class VoiceComplaintRequest(BaseModel):
    audio_url: str = Field(..., description="URL to the audio file")
    language: str = Field(default="hi", description="Language code (hi, en, etc.)")

class LegalQueryRequest(BaseModel):
    question: str = Field(..., description="Legal rights question")
    language: str = Field(default="hi", description="Language code")

class ComplaintResponse(BaseModel):
    tracking_id: str
    status: str
    message: str
    department_email: Optional[str] = None
    timestamp: Optional[str] = None

class DocumentResponse(BaseModel):
    document_id: str
    simplified_text: str
    language: str
    processing_time: float
    deadlines: List[str] = []
    action_items: List[str] = []

class OfficerDocumentResponse(BaseModel):
    document_id: str
    original_language: str
    formal_translation: str
    document_type: str
    confidence_score: float

class LegalQueryResponse(BaseModel):
    question: str
    answer: str
    citations: List[Dict[str, str]]
    language: str
    confidence: float
    response_time: float

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "NyayaBharat Platform API",
        "status": "active",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "legal_lens": "/api/document/process",
            "officer_mode": "/api/officer/translate",
            "voice_complaint": "/api/complaint/voice",
            "rights_chatbot": "/api/rights/query",
            "whatsapp": "/api/whatsapp/webhook"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "legal_lens": "active",
            "officer_mode": "active",
            "voice_complaint": "active",
            "rights_chatbot": "active",
            "whatsapp_interface": "active"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# API Endpoints

@app.post("/api/document/process", response_model=DocumentResponse, tags=["Legal Lens"])
async def process_legal_document(
    file: UploadFile = File(..., description="Legal document image (JPG, PNG, PDF)"),
    language: str = Form(default="hi", description="Target language code")
):
    """
    Process legal document for citizens (Legal_Lens Service)
    
    - Extracts text using OCR
    - Translates to user's language
    - Simplifies to 5th-grade reading level
    - Identifies deadlines and action items
    """
    if not file.content_type.startswith(('image/', 'application/pdf')):
        raise HTTPException(status_code=400, detail="Only image or PDF files are supported")
    
    try:
        image_data = await file.read()
        result = await legal_lens.process_document(image_data, language)
        return DocumentResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

@app.post("/api/officer/translate", response_model=OfficerDocumentResponse, tags=["Officer Mode"])
async def translate_vernacular_document(
    file: UploadFile = File(..., description="Vernacular document image")
):
    """
    Translate vernacular document for government officials (Officer_Mode Service)
    
    - Extracts text from vernacular documents
    - Handles handwritten text
    - Translates to formal English/Hindi
    - Formats as official government document
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are supported")
    
    try:
        image_data = await file.read()
        result = await officer_mode.process_vernacular_document(image_data)
        return OfficerDocumentResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.post("/api/complaint/voice", response_model=ComplaintResponse, tags=["Voice Complaint"])
async def file_voice_complaint(request: VoiceComplaintRequest):
    """
    File complaint via voice message (Voice_Complaint_System)
    
    - Converts speech to text
    - Categorizes complaint type
    - Extracts location and issue details
    - Routes to appropriate department
    - Generates tracking ID
    """
    try:
        result = await voice_complaint.process_voice_complaint(
            request.audio_url, 
            request.language
        )
        return ComplaintResponse(
            tracking_id=result["tracking_id"],
            status=result["status"],
            message=f"Complaint filed successfully. Track with ID: {result['tracking_id']}",
            department_email=result.get("department_email"),
            timestamp=result.get("timestamp")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Complaint filing failed: {str(e)}")

@app.post("/api/rights/query", response_model=LegalQueryResponse, tags=["Rights Chatbot"])
async def query_legal_rights(request: LegalQueryRequest):
    """
    Query legal rights information (Rights_Chatbot Service)
    
    - Searches legal documents and precedents
    - Provides authoritative answers
    - Cites specific laws (Constitution, IPC, BNS)
    - Returns context-appropriate responses
    """
    try:
        result = await rights_chatbot.answer_legal_query(
            request.question,
            request.language
        )
        return LegalQueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@app.post("/api/whatsapp/webhook", tags=["WhatsApp"])
async def whatsapp_webhook(payload: Dict[str, Any] = Body(...)):
    """
    WhatsApp webhook for message handling (WhatsApp_Interface)
    
    - Routes messages to appropriate services
    - Handles images, voice, and text
    - Maintains conversation context
    - Returns responses via WhatsApp
    """
    try:
        routing = await whatsapp_interface.route_message(payload)
        return routing
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

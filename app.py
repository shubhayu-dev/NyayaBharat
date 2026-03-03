from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import boto3
import os
from datetime import datetime
from dotenv import load_dotenv

# Import completed services
from services.rights_chatbot import RightsChatbotService
from services.voice_complaint import VoiceComplaintService  # Done by colleague

load_dotenv()

app = FastAPI(
    title="NyayaBharat API",
    version="1.0.0",
    description="AI-powered legal assistance platform for Indian citizens"
)

# --- CONFIGURATION ---
KNOWLEDGE_BASE_ID = os.getenv("AWS_KB_ID")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Initialize AWS Bedrock clients
bedrock_agent_runtime = boto3.client(
    service_name='bedrock-agent-runtime',
    region_name=AWS_REGION
)
bedrock_runtime = boto3.client(
    service_name='bedrock-runtime',
    region_name=AWS_REGION
)

MODEL_ID = "amazon.nova-lite-v1:0"

# Initialize completed services
rights_chatbot = RightsChatbotService()
voice_complaint = VoiceComplaintService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================
# PYDANTIC MODELS
# ===========================================================

class LegalQueryRequest(BaseModel):
    question: str
    language: str = "hi"

class WhatsAppMessage(BaseModel):
    sender: str
    message_type: str        # "text" | "image" | "voice"
    text: str | None = None
    media_url: str | None = None
    language: str = "hi"

# ===========================================================
# ROOT
# ===========================================================

@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "NyayaBharat API",
        "version": "1.0.0",
        "status": "running",
        "services": {
            "rights_chatbot":  "✅ Live",
            "voice_complaint": "✅ Live",
            "legal_lens":      "🚧 Coming Soon",
            "officer_mode":    "🚧 Coming Soon",
            "whatsapp":        "🚧 Coming Soon",
        }
    }

# ===========================================================
# 1. RIGHTS CHATBOT  ✅ (your work)
# ===========================================================

@app.post("/api/rights/query", tags=["Rights Chatbot"])
async def legal_query(request: LegalQueryRequest):
    """
    Answer legal questions with citations from the Indian Constitution, IPC, and BNS.
    """
    if not KNOWLEDGE_BASE_ID:
        raise HTTPException(status_code=500, detail="Missing AWS_KB_ID in environment.")

    # STEP 1: Retrieve from AWS Knowledge Base
    try:
        kb_response = bedrock_agent_runtime.retrieve(
            retrievalQuery={'text': request.question},
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalConfiguration={'vectorSearchConfiguration': {'numberOfResults': 5}}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge Base Retrieval Error: {str(e)}")

    retrieved_context = ""
    citations = []
    for result in kb_response.get('retrievalResults', []):
        text_snippet = result['content']['text']
        source_uri = result.get('location', {}).get('s3Location', {}).get('uri', "Legal Document")
        retrieved_context += f"\n---\n{text_snippet}\n"
        citations.append({"text": text_snippet, "source": source_uri})

    if not citations:
        return {"answer": "No relevant legal documents found.", "citations": []}

    # STEP 2: Generate with Amazon Nova
    try:
        prompt = f"""You are NyayaBharat, an expert in Indian Law.
Use the following legal context to answer the user's question in {request.language}.

Context:
{retrieved_context}

User Question: {request.question}
"""
        nova_response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{"role": "user", "content": [{"text": prompt}]}]
        )
        answer = nova_response["output"]["message"]["content"][0]["text"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation Error: {str(e)}")

    return {
        "question": request.question,
        "answer": answer,
        "citations": citations,
        "language": request.language,
        "response_time": datetime.now().isoformat()
    }

# ===========================================================
# 2. VOICE COMPLAINT  ✅ (colleague's work)
# ===========================================================

@app.post("/api/voice/complaint", tags=["Voice Complaint"])
async def file_voice_complaint(
    audio: UploadFile = File(..., description="Voice note (mp3/wav/ogg)"),
    language: str = Form(default="hi"),
    location: str = Form(default="", description="City or district of the issue")
):
    """
    Accept a voice note, transcribe it, auto-draft a formal complaint,
    and email the relevant authorities.
    """
    try:
        audio_bytes = await audio.read()
        result = await voice_complaint.process_voice_complaint(
            audio_bytes=audio_bytes,
            filename=audio.filename,
            language=language,
            location=location
        )
        return {
            "status": "success",
            "complaint_drafted": result.get("complaint"),
            "authorities_notified": result.get("authorities", []),
            "transcript": result.get("transcript"),
            "response_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice Complaint Error: {str(e)}")

# ===========================================================
# 3. LEGAL LENS  🚧 (placeholder — ready for implementation)
# ===========================================================

@app.post("/api/legal-lens/analyze", tags=["Legal Lens"])
async def analyze_legal_document(
    image: UploadFile = File(..., description="Photo of a legal notice or document"),
    language: str = Form(default="hi")
):
    """
    Upload a photo of a legal notice to get a simplified explanation
    and action items in your native language.
    """
    # TODO: Implement using Amazon Textract (OCR) + Nova (simplification)
    # Step 1: Textract -> extract text from image
    # Step 2: Nova -> simplify + generate action items in requested language
    raise HTTPException(
        status_code=501,
        detail="Legal Lens is under development. Coming soon!"
    )

# ===========================================================
# 4. OFFICER MODE  🚧 (placeholder — ready for implementation)
# ===========================================================

@app.post("/api/officer/scan-petition", tags=["Officer Mode"])
async def scan_petition(
    image: UploadFile = File(..., description="Photo of a handwritten petition"),
    department: str = Form(default="General", description="Government department"),
    language: str = Form(default="hi")
):
    """
    Scan a handwritten petition and convert it into a formal government document.
    """
    # TODO: Implement using Amazon Textract (handwriting OCR) + Nova (formalization)
    # Step 1: Textract -> extract handwritten text
    # Step 2: Nova -> convert to formal government document format
    raise HTTPException(
        status_code=501,
        detail="Officer Mode is under development. Coming soon!"
    )

# ===========================================================
# 5. WHATSAPP INTEGRATION  🚧 (placeholder — ready for implementation)
# ===========================================================

@app.post("/api/whatsapp/webhook", tags=["WhatsApp"])
async def whatsapp_webhook(message: WhatsAppMessage):
    """
    Handle incoming WhatsApp messages (text, image, voice).
    Routes to the appropriate service based on message type.
    """
    # TODO: Route based on message_type:
    # - "text"  -> rights_chatbot.answer_legal_query()
    # - "image" -> legal_lens (when ready)
    # - "voice" -> voice_complaint (when ready)
    raise HTTPException(
        status_code=501,
        detail="WhatsApp integration is under development. Coming soon!"
    )

@app.get("/api/whatsapp/webhook", tags=["WhatsApp"])
async def whatsapp_verify(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None
):
    """WhatsApp webhook verification endpoint."""
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "nyayabharat")
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed.")

# ===========================================================

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
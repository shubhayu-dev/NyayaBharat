from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import boto3
import os
from datetime import datetime
from dotenv import load_dotenv
import requests

# Import completed services
from services.rights_chatbot import RightsChatbotService
from services.voice_complaint import VoiceComplaintService  # Done by colleague
from services.legal_lens import legal_lens_with_nova, INDIAN_LANGUAGES
from services.officer_mode import scan_petition_with_nova, DEPARTMENTS, INDIAN_LANGUAGES as OFFICER_LANGUAGES

load_dotenv()
#hi
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
            "legal_lens":      "✅ Live",
            "officer_mode":    "✅ Live",
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

class VoiceComplaintService:
    def __init__(self):
        self.bucket_name = "nyaya-bharat-audio"
        self.s3_client = boto3.client("s3")
        self.transcribe_client = boto3.client("transcribe", region_name="us-east-1")

    def start_job(self, file_obj, job_name):
        self.s3_client.upload_fileobj(file_obj, self.bucket_name, "audio.mp3")
        
        try:
            self.transcribe_client.delete_transcription_job(TranscriptionJobName=job_name)
        except:
            pass

        self.transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': f's3://{self.bucket_name}/audio.mp3'},
            MediaFormat='mp3',
            LanguageCode='en-US' 
        )
        return job_name

    def check_result(self, job_name):
        job = self.transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
        status = job['TranscriptionJob']['TranscriptionJobStatus']
        if status == 'COMPLETED':
            url = job['TranscriptionJob']['Transcript']['TranscriptFileUri']
            content = requests.get(url).json()
            return {
                "status": status, 
                "transcript": content['results']['transcripts'][0]['transcript']
            }
            
        return {"status": status}
voice_service = VoiceComplaintService()

@app.post("/api/complaint/voice", tags=["Voice Complaints"])
async def handle_voice_complaint(file: UploadFile = File(...)):
    job_name = voice_service.start_job(file.file, "SimpleTestJob")
    return {"message": "Job started", "job_name": job_name}

@app.get("/api/complaint/result", tags=["Voice Complaints"])
async def get_result():
    return voice_service.check_result("SimpleTestJob")


# ===========================================================
# 3. LEGAL LENS  ✅
# ===========================================================

@app.post("/api/legal-lens/analyze", tags=["Legal Lens"])
async def analyze_legal_document(
    image: UploadFile = File(..., description="Photo of a legal notice or document"),
    language: str = Form(default="hi")
):
    """
    Upload a photo of a legal notice to get a simplified explanation
    and action items in your native Indian language.

    Supported language codes:
    hi: Hindi | bn: Bengali | te: Telugu | mr: Marathi | ta: Tamil
    gu: Gujarati | kn: Kannada | ml: Malayalam | pa: Punjabi
    or: Odia | as: Assamese | ur: Urdu | en: English
    """
    # Validate language code
    if language not in INDIAN_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language code '{language}'. Supported: {list(INDIAN_LANGUAGES.keys())}"
        )

    # Validate file type
    if image.content_type not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, or WebP images are supported."
        )

    # Read and size-check image
    image_bytes = await image.read()
    if len(image_bytes) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=400, detail="Image size must be under 5MB.")

    try:
        result = legal_lens_with_nova(
            image_bytes=image_bytes,
            language_code=language,
            content_type=image.content_type
        )
        return {
            "status": "success",
            "filename": image.filename,
            "language": result["language"],
            "language_code": result["language_code"],
            "analysis": result["analysis"],
            "model": result["model"],
            "response_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legal Lens Error: {type(e).__name__}: {str(e)}")

# ===========================================================
# 4. OFFICER MODE  ✅
# ===========================================================

@app.get("/api/officer/departments", tags=["Officer Mode"])
async def list_departments():
    """List all supported government departments."""
    return {"departments": DEPARTMENTS}


@app.post("/api/officer/scan-petition", tags=["Officer Mode"])
async def scan_petition(
    image: UploadFile = File(..., description="Photo of a handwritten petition (English)"),
    department: str = Form(default="general", description=f"Department key. Use /api/officer/departments to list all."),
    language: str = Form(default="en")
):
    """
    Scan a handwritten English petition and convert it into a
    formal government document for the specified department.

    Returns both the raw transcription and the formatted formal document.
    Native language support coming soon.
    """
    # Validate department
    if department.lower() not in DEPARTMENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown department '{department}'. Call /api/officer/departments for valid keys."
        )

    # Validate file type
    if image.content_type not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, or WebP images are supported."
        )

    # Validate language
    if language not in OFFICER_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language code '{language}'. Supported: {list(OFFICER_LANGUAGES.keys())}"
        )

    # Read and size-check
    image_bytes = await image.read()
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size must be under 5MB.")

    try:
        result = scan_petition_with_nova(
            image_bytes=image_bytes,
            department=department,
            content_type=image.content_type,
            language_code=language
        )
        return {
            "status": "success",
            "filename": image.filename,
            "department": result["department"],
            "language": result["language"],
            "language_code": result["language_code"],
            "transcription": result["transcription"],
            "formal_document": result["formal_document"],
            "model": result["model"],
            "response_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Officer Mode Error: {type(e).__name__}: {str(e)}")

# ===========================================================
# 5. WHATSAPP INTEGRATION  🚧 (placeholder — ready for implementation)
# ===========================================================

@app.post("/api/whatsapp/webhook", tags=["WhatsApp"])
async def whatsapp_webhook(message: WhatsAppMessage):
    """
    Handle incoming WhatsApp messages (text, image, voice).
    Routes to the appropriate service based on message type.
    """
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

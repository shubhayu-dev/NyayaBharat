from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import uuid
import boto3
import requests
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="NyayaBharat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class LegalQueryRequest(BaseModel):
    question: str
    language: str = "hi"

voice_service = VoiceComplaintService()


@app.get("/")
async def root():
    return {"message": "NyayaBharat API Active"}

@app.post("/api/document/process", tags=["Legal Lens"])
async def process_doc(file: UploadFile = File(...), language: str = Form("hi")):
    return {
        "document_id": str(uuid.uuid4())[:8],
        "simplified_text": f"This document is a formal request regarding property rights, simplified here in {language}.",
        "language": language,
        "processing_time": 1.2,
        "deadlines": ["March 15, 2026", "April 01, 2026"],
        "action_items": ["Submit Form A", "Pay Stamp Duty"]
    }

@app.post("/api/officer/translate", tags=["Officer Mode"])
async def officer_translate(file: UploadFile = File(...)):
    return {
        "document_id": str(uuid.uuid4())[:8],
        "original_language": "Marathi",
        "formal_translation": "Subject: Formal Petition for Civic Redressal...\nDetailed translation of the vernacular script follows.",
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

@app.post("/api/complaint/voice", tags=["Voice Complaints"])
async def handle_voice_complaint(file: UploadFile = File(...)):
    job_name = voice_service.start_job(file.file, "SimpleTestJob")
    return {"message": "Job started", "job_name": job_name}

@app.get("/api/complaint/result", tags=["Voice Complaints"])
async def get_result():
    return voice_service.check_result("SimpleTestJob")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
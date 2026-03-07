"""
Voice_Complaint_System - Voice-based Complaint Filing
Processes voice complaints via AWS Transcribe + Translate + Nova (with Llama fallback)
"""
import boto3
import requests
import json

MODEL_ID          = "amazon.nova-lite-v1:0"
FALLBACK_MODEL_ID = "meta.llama3-3-70b-instruct-v1:0"

COMPLAINT_PROMPT = """You are NyayaBharat, an AI legal assistant for Indian citizens.

A citizen has submitted a voice complaint. Below is their transcribed complaint in their native language, 
along with an English translation.

Your job is to convert this into a formal legal complaint letter following Indian government standards.

The formal complaint must include:
1. Subject line (clearly stating the nature of the complaint)
2. Respectful salutation (To The Concerned Authority / To The [Department] Officer)
3. Introduction (who is complaining, brief background)
4. Body (clear description of the issue, dates if mentioned, location if mentioned)
5. Legal basis (mention relevant Indian laws if applicable — e.g. Consumer Protection Act, RTI Act, IPC sections)
6. Relief sought (what action the complainant wants)
7. Closing (Yours faithfully, [Complainant])

Native Language Complaint:
{native_transcript}

English Translation:
{english_transcript}

Write the formal complaint letter in English. Be concise, professional, and legally precise.
"""


class VoiceComplaintService:
    def __init__(self):
        self.bucket_name = "nyaya-bharat-audio"
        self.s3_client = boto3.client("s3")
        self.transcribe_client = boto3.client("transcribe", region_name="us-east-1")
        self.translate_client = boto3.client("translate", region_name="us-east-1")
        self.bedrock_client = boto3.client("bedrock-runtime", region_name="us-east-1")

    def start_job(self, file_obj, job_name):
        s3_key = f"audio/{job_name}.mp3"
        self.s3_client.upload_fileobj(file_obj, self.bucket_name, s3_key)
        try:
            self.transcribe_client.delete_transcription_job(TranscriptionJobName=job_name)
        except:
            pass
        self.transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': f's3://{self.bucket_name}/{s3_key}'},
            MediaFormat='mp3',
            IdentifyLanguage=True
        )
        return job_name

    def _generate_complaint(self, prompt):
        """Try Nova first, fall back to Llama if it fails."""
        for model_id in [MODEL_ID, FALLBACK_MODEL_ID]:
            try:
                response = self.bedrock_client.converse(
                    modelId=model_id,
                    messages=[{"role": "user", "content": [{"text": prompt}]}],
                    inferenceConfig={"temperature": 0.2, "maxTokens": 1000}
                )
                return response["output"]["message"]["content"][0]["text"]
            except Exception:
                if model_id == FALLBACK_MODEL_ID:
                    raise

    def check_result(self, job_name):
        job = self.transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
        status = job['TranscriptionJob']['TranscriptionJobStatus']

        if status == 'COMPLETED':
            # Step 1: Get transcript
            url = job['TranscriptionJob']['Transcript']['TranscriptFileUri']
            content = requests.get(url).json()
            native_transcript = content['results']['transcripts'][0]['transcript']

            # Step 2: Translate to English
            translation_response = self.translate_client.translate_text(
                Text=native_transcript,
                SourceLanguageCode='auto',
                TargetLanguageCode='en'
            )
            english_transcript = translation_response['TranslatedText']

            # Step 3: Format as formal legal complaint (Nova → Llama fallback)
            prompt = COMPLAINT_PROMPT.format(
                native_transcript=native_transcript,
                english_transcript=english_transcript
            )
            formal_complaint = self._generate_complaint(prompt)

            return {
                "status": status,
                "native_transcript": native_transcript,
                "english_transcript": english_transcript,
                "formal_complaint": formal_complaint
            }

        return {"status": status}
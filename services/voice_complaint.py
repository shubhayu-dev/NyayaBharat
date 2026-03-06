"""
Voice_Complaint_System - Voice-based Complaint Filing
Processes voice complaints via AWS Transcribe + Translate + Nova
"""
import boto3
import requests
import json


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
        # Unique S3 key per user — no overwriting
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

            # Step 3: Format as formal legal complaint using Nova
            prompt = COMPLAINT_PROMPT.format(
                native_transcript=native_transcript,
                english_transcript=english_transcript
            )
            nova_response = self.bedrock_client.converse(
                modelId="amazon.nova-lite-v1:0",
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"temperature": 0.2, "maxTokens": 1000}
            )
            formal_complaint = nova_response["output"]["message"]["content"][0]["text"]

            return {
                "status": status,
                "native_transcript": native_transcript,
                "english_transcript": english_transcript,
                "formal_complaint": formal_complaint
            }

        return {"status": status}
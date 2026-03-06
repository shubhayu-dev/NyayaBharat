"""
Voice_Complaint_System - Voice-based Complaint Filing
Processes voice complaints via AWS Transcribe + Translate
"""
import boto3
import requests
import uuid


class VoiceComplaintService:
    def __init__(self):
        self.bucket_name = "nyaya-bharat-audio"
        self.s3_client = boto3.client("s3")
        self.transcribe_client = boto3.client("transcribe", region_name="us-east-1")
        self.translate_client = boto3.client("translate", region_name="us-east-1")

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
            url = job['TranscriptionJob']['Transcript']['TranscriptFileUri']
            content = requests.get(url).json()
            native_transcript = content['results']['transcripts'][0]['transcript']

            translation_response = self.translate_client.translate_text(
                Text=native_transcript,
                SourceLanguageCode='auto',
                TargetLanguageCode='en'
            )
            english_transcript = translation_response['TranslatedText']

            return {
                "status": status,
                "native_transcript": native_transcript,
                "english_transcript": english_transcript
            }

        return {"status": status}
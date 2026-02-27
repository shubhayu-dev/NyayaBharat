# NyayaBharat Platform - Prototype

Unified civic engagement and legal assistance platform for Indian citizens.

## Features

- **Legal_Lens**: Document processing and translation for citizens
- **Officer_Mode**: Vernacular document translation for government officials
- **Voice_Complaint_System**: Voice-based complaint filing
- **Rights_Chatbot**: Legal rights information with RAG
- **WhatsApp_Interface**: WhatsApp bot integration

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

Server runs at `http://localhost:8000`

## API Endpoints

- `POST /api/document/process` - Process legal documents
- `POST /api/officer/translate` - Translate vernacular documents
- `POST /api/complaint/voice` - File voice complaints
- `POST /api/rights/query` - Query legal rights
- `POST /api/whatsapp/webhook` - WhatsApp webhook

## Architecture

```
WhatsApp Bot → API Gateway → Services → AWS (Textract, Bedrock, Transcribe, SES)
```

## Services

- `services/legal_lens.py` - Document processing
- `services/officer_mode.py` - Official translations
- `services/voice_complaint.py` - Complaint filing
- `services/rights_chatbot.py` - Legal Q&A
- `services/whatsapp_interface.py` - WhatsApp integration

# NyayaBharat Platform ⚖️

**NyayaBharat** is a unified civic engagement and legal assistance platform designed to bridge the gap between Indian citizens and the legal system through AI-driven simplification and vernacular support.

Built for the **AI for Bharat Hackathon**.

---

## 🚀 Features

### 📄 Legal Lens
Upload complex legal notices and receive:
- Simplified explanation at a 5th-grade reading level
- Extracted deadlines
- Clear action items in your native language

**Supported output languages:** `hi`, `en`, `bn`, `ta`, `te`, `mr`, `gu`

> Select your language in the Streamlit dashboard dropdown — the previous version hard-coded `language=en`.

**Notes:**
- OCR (EasyOCR) works best with **English and Hindi** documents. Bengali OCR is hit-or-miss, but translation still works via the model.
- You do **not** need a Gemini API key. The backend uses only **Groq** (`GROQ_API_KEY`).
- `[DEBUG]` messages are printed during processing to help verify which language is being requested and whether the model returned non-ASCII text.
- A Torch warning about `pin_memory` when EasyOCR loads is harmless on CPU.

---

### 🏛️ Officer Mode
Assists government officials by:
- Scanning handwritten citizen petitions (via Amazon Textract)
- Converting them into formal official documents

> 🚧 Under development

---

### 🎙️ Voice Complaint System
- File grievances via voice messages
- Automatic transcription (Amazon Transcribe)
- Smart categorization and routing to the correct department
- Auto-drafts formal complaints and emails authorities

---

### 🤖 Rights Chatbot
A RAG-powered assistant providing:
- Authoritative answers on Indian law
- References from the Constitution, BNS, and IPC
- Specific citations from the AWS Knowledge Base

---

### 📲 WhatsApp Interface
- Seamless access via WhatsApp Business bot
- Full multimedia support: text, images, and voice
- Entry point routing to all services

> 🚧 Under development

---

## 🏗️ Architecture

| Layer | Technology |
|---|---|
| 🖥️ Frontend | Streamlit |
| ⚙️ Backend | FastAPI (Async REST) |
| 🧠 LLM | AWS Bedrock — Amazon Nova Lite |
| 📄 OCR | Amazon Textract + EasyOCR |
| 🎙️ Voice | Amazon Transcribe |
| 🗄️ RAG | AWS Bedrock Knowledge Base |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — lists all services and status |
| `POST` | `/api/rights/query` | Ask a legal question — returns answer + citations |
| `POST` | `/api/voice/complaint` | Upload voice note — transcribes and files complaint |
| `POST` | `/api/legal-lens/analyze` | Upload legal notice image — returns simplified explanation |
| `POST` | `/api/officer/scan-petition` | Upload handwritten petition — returns formal document |
| `POST` | `/api/whatsapp/webhook` | Receive WhatsApp messages (text / image / voice) |
| `GET` | `/api/whatsapp/webhook` | WhatsApp webhook verification |

---

## 🛠️ Quick Start

### Prerequisites
- Python 3.12+
- Virtual environment activated
- AWS credentials configured with access to Bedrock, Textract, and Transcribe

### Installation

```bash
pip install -r requirements.txt
```

---

## ▶️ Running the Platform

Run both the backend and frontend in separate terminals.

### Terminal 1 — Backend API

```bash
python app.py
```

API: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### Terminal 2 — Frontend Dashboard

```bash
streamlit run dashboard.py
```

UI: `http://localhost:8501`

---

## 📁 Project Structure

```
NyayaBharat/
├── app.py                     # FastAPI application and all routing
├── dashboard.py               # Streamlit user interface
├── services/
│   ├── rights_chatbot.py      # RAG chatbot (AWS Bedrock + Knowledge Base)
│   ├── voice_complaint.py     # Voice transcription and complaint filing
│   ├── legal_lens.py          # Legal notice OCR + simplification
│   ├── officer_mode.py        # Handwritten petition digitization
│   └── whatsapp_interface.py  # WhatsApp Business integration
├── requirements.txt
├── .env                       # Secret keys (never commit this)
└── .gitignore
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AWS_KB_ID` | ✅ Always | Bedrock Knowledge Base ID for Rights Chatbot |
| `AWS_REGION` | ✅ Always | AWS region (default: `us-east-1`) |
| `GROQ_API_KEY` | ✅ Legal Lens | Groq API key for OCR simplification |
| `WHATSAPP_VERIFY_TOKEN` | 🚧 When ready | Token for WhatsApp webhook verification |

---

## 🔐 .gitignore

```
__pycache__/
*.py[cod]
.env
.venv
env/
venv/
.vscode/
.idea/
*.log
dist/
build/
*.egg-info/
.aws/
credentials
secrets.json
```

---

## 👩‍💻 Built For

**AI for Bharat Hackathon**  
*Empowering citizens. Simplifying justice. Bridging governance.*
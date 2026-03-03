# NyayaBharat Platform ⚖️

**NyayaBharat** is a unified civic engagement and legal assistance platform designed to bridge the gap between Indian citizens and the legal system through AI-driven simplification and vernacular support.

Built for the AI for Bharat Hackathon.

---

## 🚀 Features

### 📄 Legal Lens  
Upload complex legal notices and receive:
- Simplified explanation at a 5th-grade reading level  
- Extracted deadlines  
- Clear action items  

The Streamlit dashboard now includes a language dropdown.  Make sure you
select **Hindi** or **Bengali** etc. instead of the default **English**; the
front end previously hard‑coded `language=en`, which is why every response
came back in English.

**Note on Languages:**
- The OCR engine (EasyOCR) works best with **English and Hindi** documents.
  Bengali OCR is hit‑or‑miss due to library limitations, but translation still
  happens via the model.
- You can request output in any of the supported languages: `hi`, `en`, `bn`,
  `ta`, `te`, `mr`, `gu`.
- The output **simplification and translation** are always performed in your
  requested language via the Groq LLM, regardless of the input document's
  language (as long as OCR can detect text).

> You do **not** need a Gemini API key. The backend uses only Groq
> (configured via `GROQ_API_KEY`). No Google API is involved unless you
> deliberately rewrite the service.  

**Debugging & logs:**
- The service prints `[DEBUG]` messages when processing documents and
  performing translations. These help verify which language is being requested
  and whether the model returned ASCII (English) or non‑ASCII text.  
- You may see a Torch warning about `pin_memory` when EasyOCR loads; this is
  harmless on CPU.

### 🏛️ Officer Mode  
Assists government officials by:
- Translating vernacular citizen petitions  
- Converting them into formal official English/Hindi  

### 🎙️ Voice Complaint System  
- File grievances via voice messages  
- Automatic transcription  
- Smart categorization  
- Routed to the correct department  

### 🤖 Rights Chatbot  
A RAG-powered assistant providing:
- Authoritative answers on Indian law  
- References from Constitution, BNS, IPC  
- Specific citations  

### 📲 WhatsApp Interface  
- Seamless access via WhatsApp Business bot  
- Entry point for all services  

---

## 🏗️ Architecture

NyayaBharat follows a decoupled architecture for scalability:

### 🖥️ Frontend
- Streamlit (Python-based UI dashboard)

### ⚙️ Backend
- FastAPI (Asynchronous REST API)

### 🧠 Intelligence Layer
- AWS Textract (OCR processing)  
- AWS Bedrock (LLM processing)  
- AWS Transcribe (Voice-to-Text)  

---

## 🛠️ Quick Start

### ✅ Prerequisites
- Python 3.12+  
- Virtual environment activated  

### 📦 Installation

```bash
pip install -r requirements.txt
```

---

## ▶️ Running the Platform

You must run both the backend and frontend in separate terminals.

### 🖥️ Terminal 1: Backend API

```bash
python main.py
```

API runs at:  
http://localhost:8000

---

### 🖥️ Terminal 2: Frontend Dashboard

```bash
streamlit run dashboard.py
```

UI runs at:  
http://localhost:8501

---

## 📁 Project Structure

```text
main.py            # FastAPI application and routing
dashboard.py       # Streamlit-based user interface
services/          # Core logic for OCR, translation, and RAG
requirements.txt   # Python dependencies
.gitignore         # Prevents sensitive/local files from being pushed
```

---

## 🔐 .gitignore

Create a file named `.gitignore` in your root folder and paste the following:

```text
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Project specific
.vscode/
.idea/
*.log

# Distribution / packaging
dist/
build/
*.egg-info/

# AWS/Secrets
.aws/
credentials
secrets.json
```

This ensures:
- Virtual environments are not pushed  
- Local configuration files remain private  
- AWS credentials and secrets stay secure  

---

## 👩‍💻 Built For

AI for Bharat Hackathon  
Empowering citizens. Simplifying justice. Bridging governance.
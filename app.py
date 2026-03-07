from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import boto3
import redis
import numpy as np
import hashlib
import os
from datetime import datetime
from dotenv import load_dotenv
import requests
from fastapi.responses import StreamingResponse
import json
import uuid

# Import completed services
from services.rights_chatbot import RightsChatbotService
from services.voice_complaint import VoiceComplaintService  # Done by colleague
from services.legal_lens import legal_lens_with_nova, INDIAN_LANGUAGES
from services.officer_mode import scan_petition_with_nova, DEPARTMENTS, INDIAN_LANGUAGES as OFFICER_LANGUAGES

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

MODEL_ID          = "amazon.nova-lite-v1:0"
FALLBACK_MODEL_ID = "meta.llama3-3-70b-instruct-v1:0"

# ===========================================================
# SEMANTIC CACHE (Redis)
# ===========================================================

try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    CACHE_ENABLED = True
except Exception:
    redis_client = None
    CACHE_ENABLED = False

CACHE_TTL        = 60 * 60 * 24  # 24 hours
SIMILARITY_THRESHOLD = 0.92       # tune: higher = stricter match required

def get_embedding(text: str) -> list:
    """Get text embedding from Amazon Titan for semantic similarity."""
    response = bedrock_runtime.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({"inputText": text[:8000]}),
        contentType="application/json",
        accept="application/json"
    )
    return json.loads(response['body'].read())['embedding']

def cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))

def cache_lookup(question: str, language: str):
    """
    Search Redis for a semantically similar cached question.
    Returns cached entry dict or None.
    """
    if not CACHE_ENABLED:
        return None
    try:
        query_vec = get_embedding(question)
        keys = redis_client.keys("nyaya:cache:*")
        best_score, best_key = 0.0, None
        for key in keys:
            stored = redis_client.hgetall(key)
            if stored.get('language') != language:
                continue
            cached_vec = json.loads(stored['embedding'])
            score = cosine_similarity(query_vec, cached_vec)
            if score > best_score:
                best_score, best_key = score, key
        if best_score >= SIMILARITY_THRESHOLD and best_key:
            entry = redis_client.hgetall(best_key)
            return {
                'answer': entry['answer'],
                'citations': json.loads(entry['citations']),
                'relevance_score': float(entry.get('relevance_score', 0.8)),
                'model_used': entry.get('model_used', 'cached'),
                'similarity': best_score
            }
    except Exception:
        pass
    return None

def cache_save(question: str, language: str, answer: str, citations: list,
               relevance_score: float, model_used: str):
    """Save a question+answer to Redis with its embedding."""
    if not CACHE_ENABLED:
        return
    try:
        key = f"nyaya:cache:{hashlib.md5((question+language).encode()).hexdigest()}"
        embedding = get_embedding(question)
        redis_client.hset(key, mapping={
            'question':       question,
            'language':       language,
            'answer':         answer,
            'citations':      json.dumps(citations),
            'relevance_score': str(relevance_score),
            'model_used':     model_used,
            'embedding':      json.dumps(embedding)
        })
        redis_client.expire(key, CACHE_TTL)
    except Exception:
        pass

# Model tiers for query routing
MODEL_SIMPLE  = "amazon.nova-lite-v1:0"   # fast, cheap — factual/definition questions
MODEL_COMPLEX = "amazon.nova-pro-v1:0"    # powerful — multi-step legal analysis

# ===========================================================
# QUERY ROUTER
# ===========================================================

def route_query(question: str) -> str:
    """
    Classify the question as SIMPLE or COMPLEX.
    Returns the appropriate model ID to use.

    SIMPLE: definitions, yes/no, single-law lookups
    COMPLEX: multi-law analysis, case strategies, comparisons, rights in specific scenarios
    """
    routing_prompt = f"""You are a query complexity classifier for a legal AI system.

Classify this legal question as either SIMPLE or COMPLEX.

SIMPLE = factual, single-concept, definition-based questions
  Examples: "What is RTI?", "What does IPC 420 mean?", "How many days to file consumer complaint?"

COMPLEX = multi-step reasoning, scenario analysis, strategy, comparisons, or multiple laws
  Examples: "What are my options if police refuse to file FIR?", "Compare rights under POCSO vs IPC for minors", "How do I fight wrongful termination step by step?"

Question: {question}

Reply with ONLY one word: SIMPLE or COMPLEX"""

    try:
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{"role": "user", "content": [{"text": routing_prompt}]}],
            inferenceConfig={"maxTokens": 5, "temperature": 0.0}
        )
        verdict = response["output"]["message"]["content"][0]["text"].strip().upper()
        return MODEL_COMPLEX if "COMPLEX" in verdict else MODEL_SIMPLE
    except:
        return MODEL_SIMPLE  # default to fast model if routing fails

# ===========================================================
# SELF-RAG HELPERS
# ===========================================================

def score_relevance(question: str, context: str) -> float:
    """
    Ask Nova to score how relevant the retrieved context is to the question.
    Returns a float between 0.0 and 1.0.
    """
    scoring_prompt = f"""Context precision score task:
Do the retrieved documents contain information needed to answer the question?
Give a score from 0.0 to 1.0 where 1.0 means the documents are perfectly relevant.
QUESTION: {question}
DOCUMENTS: {context[:2000]}
Output ONLY a decimal like 0.8 or 0.3 — nothing else:"""

    try:
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{"role": "user", "content": [{"text": scoring_prompt}]}],
            inferenceConfig={"maxTokens": 10, "temperature": 0.0}
        )
        score_text = response["output"]["message"]["content"][0]["text"].strip()
        # Extract first float found in response (handles "0.8" or "0.8/1.0" or "Score: 0.8")
        import re
        matches = re.findall(r'[0-9]+[.][0-9]+|[0-9]+', score_text)
        if matches:
            val = float(matches[0])
            return min(max(val, 0.0), 1.0)  # clamp to 0-1
        return 0.5
    except:
        return 0.5  # default to neutral if scoring fails


def rephrase_query(question: str) -> str:
    """
    Ask Nova to rephrase the question for better retrieval.
    """
    rephrase_prompt = f"""Rephrase this legal question to improve document retrieval from an Indian legal database.
Make it more specific and use legal terminology where appropriate.

Original: {question}

Rephrased question (just the question, nothing else):"""

    try:
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{"role": "user", "content": [{"text": rephrase_prompt}]}],
            inferenceConfig={"maxTokens": 100, "temperature": 0.3}
        )
        return response["output"]["message"]["content"][0]["text"].strip()
    except:
        return question  # fallback to original

# Initialize completed services
rights_chatbot = RightsChatbotService()
voice_complaint = VoiceComplaintService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
# 1b. RIGHTS CHATBOT — STREAMING  ✅
# ===========================================================

@app.post("/api/rights/stream", tags=["Rights Chatbot"])
async def legal_query_stream(request: LegalQueryRequest):
    """
    Streaming version of the rights chatbot.
    Returns Server-Sent Events (SSE) — chunks arrive word by word.
    """
    if not KNOWLEDGE_BASE_ID:
        raise HTTPException(status_code=500, detail="Missing AWS_KB_ID in environment.")

    # STEP 0: Semantic Cache lookup — skip RAG entirely if similar question seen before
    cached = cache_lookup(request.question, request.language)
    if cached:
        async def cached_response():
            yield f"data: {json.dumps({'type': 'citations', 'citations': cached['citations'], 'relevance_score': cached['relevance_score'], 'model_used': '💾 Cached', 'from_cache': True, 'similarity': round(cached['similarity'] * 100)})}\n\n"
            # Stream cached answer token by token for consistent UX
            words = cached['answer'].split(' ')
            for i, word in enumerate(words):
                chunk = word + ('' if i == len(words)-1 else ' ')
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(cached_response(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # STEP 1: Self-RAG Retrieval with re-query if relevance is low
    def retrieve_docs(query: str):
        kb_response = bedrock_agent_runtime.retrieve(
            retrievalQuery={'text': query},
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalConfiguration={'vectorSearchConfiguration': {'numberOfResults': 5}}
        )
        ctx = ""
        cits = []
        for result in kb_response.get('retrievalResults', []):
            text_snippet = result['content']['text']
            source_uri = result.get('location', {}).get('s3Location', {}).get('uri', "Legal Document")
            ctx += f"\n---\n{text_snippet}\n"
            cits.append({"text": text_snippet, "source": source_uri})
        return ctx, cits

    try:
        retrieved_context, citations = retrieve_docs(request.question)

        if not citations:
            async def empty():
                yield f"data: {json.dumps({'type': 'done', 'answer': 'No relevant legal documents found.', 'citations': []})}\n\n"
            return StreamingResponse(empty(), media_type="text/event-stream")

        # Self-RAG: score relevance — re-query if score is too low
        relevance_score = score_relevance(request.question, retrieved_context)
        if relevance_score < 0.5:
            rephrased = rephrase_query(request.question)
            new_context, new_citations = retrieve_docs(rephrased)
            # Use whichever retrieval gave more results
            if new_citations:
                retrieved_context, citations = new_context, new_citations

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge Base Retrieval Error: {str(e)}")

    # Route to appropriate model based on question complexity
    routed_model = route_query(request.question)

    prompt = f"""You are NyayaBharat, an expert in Indian Law.
Use the following legal context to answer the user's question in {request.language}.

Context:
{retrieved_context}

User Question: {request.question}
"""

    async def stream_response():
        try:
            # Send citations + relevance score + which model was chosen
            yield f"data: {json.dumps({'type': 'citations', 'citations': citations, 'relevance_score': relevance_score, 'model_used': routed_model})}\n\n"

            # Try routed model first, fall back to Llama
            for model_id in [routed_model, FALLBACK_MODEL_ID]:
                try:
                    response = bedrock_runtime.converse_stream(
                        modelId=model_id,
                        messages=[{"role": "user", "content": [{"text": prompt}]}]
                    )
                    full_answer = ''
                    for event in response['stream']:
                        if 'contentBlockDelta' in event:
                            delta = event['contentBlockDelta'].get('delta', {})
                            if 'text' in delta:
                                full_answer += delta['text']
                                yield f"data: {json.dumps({'type': 'chunk', 'text': delta['text']})}\n\n"
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"

                    # Auto-evaluate the response (RAGAS metrics)
                    try:
                        import re as _re
                        def quick_score(prompt):
                            r = bedrock_runtime.converse(
                                modelId=MODEL_ID,
                                messages=[{"role": "user", "content": [{"text": prompt}]}],
                                inferenceConfig={"maxTokens": 10, "temperature": 0.0}
                            )
                            raw = r["output"]["message"]["content"][0]["text"].strip()
                            matches = _re.findall(r'[0-9]+[.][0-9]+|[0-9]+', raw)
                            val = float(matches[0]) if matches else 0.5
                            return min(max(val, 0.0), 1.0)

                        ctx_block = "\n---\n".join([c['text'] for c in citations[:3]])
                        faithfulness = quick_score(f"""Faithfulness score task:
Read the CONTEXT and ANSWER below. Every claim in the answer must be traceable to the context.
Give a score from 0.0 to 1.0 where 1.0 means every single claim is supported by the context.
CONTEXT: {ctx_block[:1200]}
ANSWER: {full_answer[:800]}
Output ONLY a decimal like 0.8 or 0.5 — nothing else:""")
                        answer_relevance = quick_score(f"""Answer relevance score task:
Does the ANSWER directly and completely address the QUESTION?
Give a score from 0.0 to 1.0 where 1.0 means fully answered.
QUESTION: {request.question}
ANSWER: {full_answer[:800]}
Output ONLY a decimal like 0.8 or 0.5 — nothing else:""")
                        context_precision = relevance_score  # reuse Self-RAG score
                        overall = round((faithfulness + answer_relevance + context_precision) / 3, 2)
                        yield f"data: {json.dumps({'type': 'ragas', 'faithfulness': round(faithfulness, 2), 'answer_relevance': round(answer_relevance, 2), 'context_precision': round(context_precision, 2), 'overall': overall})}\n\n"
                    except Exception as eval_err:
                        yield f"data: {json.dumps({'type': 'ragas', 'faithfulness': 0.5, 'answer_relevance': 0.5, 'context_precision': round(relevance_score,2), 'overall': 0.5, 'error': str(eval_err)})}\n\n"

                    # Save to semantic cache for future similar questions
                    cache_save(request.question, request.language, full_answer,
                               citations, relevance_score, routed_model)
                    return
                except Exception:
                    if model_id == FALLBACK_MODEL_ID:
                        raise

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # important for nginx proxies
        }
    )

# ===========================================================
# 2. VOICE COMPLAINT  ✅ (colleague's work)
# ===========================================================

@app.post("/api/complaint/voice", tags=["Voice Complaints"])
async def handle_voice_complaint(file: UploadFile = File(...)):
    job_name = f"nyaya-{uuid.uuid4().hex[:12]}"
    voice_complaint.start_job(file.file, job_name)
    return {"message": "Job started", "job_name": job_name}

@app.get("/api/complaint/result/{job_name}", tags=["Voice Complaints"])
async def get_result(job_name: str):
    return voice_complaint.check_result(job_name)


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


# ===========================================================
# RAGAS-STYLE EVALUATION ENDPOINT
# ===========================================================

class EvalRequest(BaseModel):
    question: str
    answer: str
    contexts: list[str]  # the retrieved doc chunks used

class EvalResult(BaseModel):
    faithfulness: float
    answer_relevance: float
    context_precision: float
    overall: float
    verdict: str

@app.post("/api/evaluate", tags=["Evaluation"])
async def evaluate_response(req: EvalRequest):
    """
    RAGAS-style evaluation of a RAG response.
    Scores Faithfulness, Answer Relevance, and Context Precision.
    Returns scores 0.0 - 1.0 for each metric.
    """

    context_block = "\n---\n".join(req.contexts[:5])

    # --- Metric 1: Faithfulness ---
    # Is every claim in the answer supported by the retrieved context?
    faithfulness_prompt = f"""You are a RAGAS evaluator measuring Faithfulness.

Question: {req.question}

Retrieved Context:
{context_block}

Answer to evaluate:
{req.answer}

Faithfulness measures: Are all claims in the answer supported by the context?
- 1.0 = every statement is grounded in the context
- 0.5 = some statements go beyond the context
- 0.0 = answer contradicts or ignores the context entirely

Respond with ONLY a decimal number between 0.0 and 1.0:"""

    # --- Metric 2: Answer Relevance ---
    # Does the answer actually address what was asked?
    relevance_prompt = f"""You are a RAGAS evaluator measuring Answer Relevance.

Question: {req.question}

Answer to evaluate:
{req.answer}

Answer Relevance measures: Does the answer directly address the question asked?
- 1.0 = answer fully and directly addresses the question
- 0.5 = answer is related but incomplete or off-topic in parts
- 0.0 = answer does not address the question at all

Respond with ONLY a decimal number between 0.0 and 1.0:"""

    # --- Metric 3: Context Precision ---
    # Were the retrieved chunks actually useful for answering?
    precision_prompt = f"""You are a RAGAS evaluator measuring Context Precision.

Question: {req.question}

Retrieved Context:
{context_block}

Context Precision measures: How relevant and useful were the retrieved documents for answering this question?
- 1.0 = all retrieved chunks are highly relevant to the question
- 0.5 = some chunks are relevant, others are noise
- 0.0 = retrieved chunks are completely irrelevant to the question

Respond with ONLY a decimal number between 0.0 and 1.0:"""

    def score(prompt):
        try:
            r = bedrock_runtime.converse(
                modelId=MODEL_ID,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"maxTokens": 10, "temperature": 0.0}
            )
            return float(r["output"]["message"]["content"][0]["text"].strip())
        except:
            return 0.0

    faithfulness      = score(faithfulness_prompt)
    answer_relevance  = score(relevance_prompt)
    context_precision = score(precision_prompt)
    overall           = round((faithfulness + answer_relevance + context_precision) / 3, 3)

    if overall >= 0.8:
        verdict = "✅ Excellent — highly accurate and grounded"
    elif overall >= 0.6:
        verdict = "⚠️ Good — minor gaps in grounding or relevance"
    else:
        verdict = "❌ Poor — answer may be hallucinated or off-topic"

    return EvalResult(
        faithfulness=round(faithfulness, 3),
        answer_relevance=round(answer_relevance, 3),
        context_precision=round(context_precision, 3),
        overall=overall,
        verdict=verdict
    )

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
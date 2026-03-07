import boto3
import json
import base64

bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-1')

MODEL_ID          = "amazon.nova-lite-v1:0"
FALLBACK_MODEL_ID = "amazon.nova-pro-v1:0"  # fallback — also supports vision

INDIAN_LANGUAGES = {
    "hi": "Hindi", "bn": "Bengali", "te": "Telugu", "mr": "Marathi",
    "ta": "Tamil", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
    "pa": "Punjabi", "or": "Odia", "as": "Assamese", "ur": "Urdu", "en": "English",
}

FORMAT_MAP = {
    "image/jpeg": "jpeg", "image/jpg": "jpeg",
    "image/png": "png", "image/webp": "webp", "image/gif": "gif",
}

def _invoke(model_id, body_dict):
    response = bedrock.invoke_model(
        body=json.dumps(body_dict),
        modelId=model_id,
        contentType="application/json",
        accept="application/json"
    )
    result = json.loads(response.get('body').read())
    return (
        result.get("output", {})
              .get("message", {})
              .get("content", [{}])[0]
              .get("text", "")
    )

def legal_lens_with_nova(image_bytes: bytes, language_code: str = "hi", content_type: str = "image/jpeg") -> dict:
    language_name = INDIAN_LANGUAGES.get(language_code, "Hindi")
    image_format = FORMAT_MAP.get(content_type, "jpeg")

    prompt = f"""You are a legal assistant helping common people in India understand legal notices.

Analyze the legal document/notice in the image and respond ENTIRELY in {language_name} language.

Your response must follow this exact structure:

**सारांश / Summary:**
[2-3 sentence plain-language summary of what this document is about]

**मुख्य बातें / Key Points:**
1. [Important point 1]
2. [Important point 2]
3. [Important point 3]

**आवश्यक कदम / Action Items:**
1. [What the person must do first, with any deadline]
2. [Second action to take]
3. [Third action — e.g. consult a lawyer if needed]

**समय सीमा / Deadlines:**
[List any dates or deadlines mentioned, or state "कोई स्पष्ट समय सीमा नहीं" if none found]

Use simple, everyday {language_name} that a common person can understand. Avoid legal jargon.
If the document is not clearly visible or readable, say so clearly in {language_name}."""

    body = {
        "messages": [{
            "role": "user",
            "content": [
                {"image": {"format": image_format, "source": {"bytes": base64.b64encode(image_bytes).decode("utf-8")}}},
                {"text": prompt}
            ]
        }],
        "inferenceConfig": {"max_new_tokens": 1024, "temperature": 0.3}
    }

    output_text = None
    used_model = MODEL_ID
    for model_id in [MODEL_ID, FALLBACK_MODEL_ID]:
        try:
            output_text = _invoke(model_id, body)
            used_model = model_id
            break
        except Exception:
            if model_id == FALLBACK_MODEL_ID:
                raise

    return {
        "language": language_name,
        "language_code": language_code,
        "analysis": output_text,
        "model": used_model
    }
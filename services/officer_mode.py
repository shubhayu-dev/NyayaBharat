import boto3
import json
import base64

bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-1')
translate_client = boto3.client('translate', region_name='us-east-1')

MODEL_ID          = "amazon.nova-lite-v1:0"
FALLBACK_MODEL_ID = "amazon.nova-pro-v1:0"  # fallback — also supports vision

DEPARTMENTS = {
    "general": "General Administration", "revenue": "Revenue Department",
    "police": "Police Department", "municipal": "Municipal Corporation",
    "health": "Department of Health & Family Welfare", "education": "Department of Education",
    "pwd": "Public Works Department", "electricity": "Electricity Department",
    "water": "Water Supply & Sanitation Department", "social": "Department of Social Welfare",
    "agriculture": "Department of Agriculture", "transport": "Regional Transport Office",
}

INDIAN_LANGUAGES = {
    "en": "English", "hi": "Hindi", "bn": "Bengali", "te": "Telugu",
    "mr": "Marathi", "ta": "Tamil", "gu": "Gujarati", "kn": "Kannada",
    "ml": "Malayalam", "pa": "Punjabi", "or": "Odia", "as": "Assamese", "ur": "Urdu",
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

def scan_petition_with_nova(
    image_bytes: bytes,
    department: str = "general",
    content_type: str = "image/png",
    language_code: str = "en"
) -> dict:
    department_key = department.lower().strip()
    department_name = DEPARTMENTS.get(department_key, "General Administration")
    image_format = FORMAT_MAP.get(content_type, "png")
    language_name = INDIAN_LANGUAGES.get(language_code, "English")
    is_english = language_code == "en"

    prompt = f"""You are an expert government document officer in India.

You will be given a photo of a handwritten petition or application.

Your job has TWO parts:

---

PART 1 — TRANSCRIPTION:
Read the handwritten text carefully and transcribe it exactly as written (in whatever language it is written).
Label this section: "TRANSCRIBED TEXT:"

---

PART 2 — FORMAL DOCUMENT:
Convert the transcribed petition into a formal government document addressed to the {department_name}.

The formal document must follow this exact structure:

To,
The [Senior Officer Title],
{department_name},
[District/City as mentioned in petition, or leave blank]

Subject: [One line subject derived from the petition]

Respected Sir/Madam,

[Opening line: "I/We, the undersigned, wish to bring to your kind attention the following matter:"]

[Body: 2-3 formal paragraphs expanding on the petition's content. Use formal government language.
Include all key facts, dates, names, and places mentioned in the original petition.]

[Closing: "I/We, therefore, humbly request your kind intervention and appropriate action in the above matter at the earliest."]

Yours faithfully,

[Petitioner Name as mentioned]
[Address as mentioned]
[Date as mentioned, or leave blank]

---

Label this section: "FORMAL DOCUMENT:"

Important rules:
- Do not invent facts not present in the original petition
- Keep all names, dates, places, and figures exactly as written
- Use formal, respectful government language throughout
- If handwriting is unclear in any part, note it with [unclear] in the transcription
- The TRANSCRIPTION in Part 1 should always be in the original language as written
- The FORMAL DOCUMENT in Part 2 must be written entirely in {language_name}{"" if is_english else f" ({language_name} script, not transliteration)"}"""

    body = {
        "messages": [{
            "role": "user",
            "content": [
                {"image": {"format": image_format, "source": {"bytes": base64.b64encode(image_bytes).decode("utf-8")}}},
                {"text": prompt}
            ]
        }],
        "inferenceConfig": {"max_new_tokens": 2048, "temperature": 0.2}
    }

    full_output = None
    used_model = MODEL_ID
    for model_id in [MODEL_ID, FALLBACK_MODEL_ID]:
        try:
            full_output = _invoke(model_id, body)
            used_model = model_id
            break
        except Exception:
            if model_id == FALLBACK_MODEL_ID:
                raise

    transcription = ""
    formal_document = ""
    if "TRANSCRIBED TEXT:" in full_output and "FORMAL DOCUMENT:" in full_output:
        parts = full_output.split("FORMAL DOCUMENT:")
        transcription = parts[0].replace("TRANSCRIBED TEXT:", "").strip()
        formal_document = parts[1].strip()
    else:
        formal_document = full_output.strip()

    english_transcription = transcription
    if not is_english and transcription:
        try:
            translation = translate_client.translate_text(
                Text=transcription, SourceLanguageCode='auto', TargetLanguageCode='en'
            )
            english_transcription = translation['TranslatedText']
        except Exception:
            english_transcription = transcription

    return {
        "department": department_name,
        "department_key": department_key,
        "language": language_name,
        "language_code": language_code,
        "transcription": transcription,
        "english_transcription": english_transcription,
        "formal_document": formal_document,
        "model": used_model
    }
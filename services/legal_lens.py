from typing import Dict, Any
import uuid
import os
import aiofiles
from dotenv import load_dotenv
from groq import AsyncGroq 
import easyocr

load_dotenv()

class LegalLensService:
    def __init__(self):
        # Ensure exactly 8 spaces/2 tabs here to fix IndentationError
        self.supported_languages = ["hi", "en", "bn", "ta", "te", "mr", "gu"]
        
        # Load EasyOCR reader. Bengali requires Assamese per EasyOCR constraints,
        # so we use ['en', 'hi'] for Hindi documents and ['bn', 'as', 'en'] for
        # Bengali. We initialize with Hindi first and accept the limitation that
        # Bengali OCR may not work perfectly; the LLM will still translate.
        self.reader = easyocr.Reader(['en', 'hi'])
        self.client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))

    async def extract_text(self, image_path: str) -> str:
        # EasyOCR returns text directly when detail=0
        result = self.reader.readtext(image_path, detail=0)
        
        full_text = " ".join(result)
        return full_text.strip()

    async def process_document(self, image_data: bytes, language: str = "hi") -> Dict[str, Any]:
        doc_id = str(uuid.uuid4())[:8]
        temp_path = f"temp_{doc_id}.png"
        print(f"[DEBUG] process_document called with language={language}")
        
        # make sure the caller asked for a language we support
        if language not in self.supported_languages:
            return {
                "status": "error",
                "message": f"Unsupported language '{language}'. Supported: {', '.join(self.supported_languages)}"
            }

        async with aiofiles.open(temp_path, mode="wb") as f:
            await f.write(image_data)
        
        try:
            raw_text = await self.extract_text(temp_path)
            
            if not raw_text:
                return {"status": "error", "message": "No text detected."}

            simplified = await self.translate_and_simplify(raw_text, language)
            
            return {
                "document_id": doc_id,
                "extracted_text": raw_text,
                "simplified_text": simplified,
                "language": language,
                "status": "success"
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    async def translate_and_simplify(self, text: str, target_language: str) -> str:
        """Translate and simplify to the requested language.
        
        Maps two-letter codes to full language names (Groq understands these better).
        If first response is ASCII but we requested non-English, retry with stricter prompt.
        """
        # Map codes to full language names
        name_map = {
            "hi": "Hindi",
            "en": "English",
            "bn": "Bengali",
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi",
            "gu": "Gujarati",
        }
        lang_name = name_map.get(target_language, target_language)
        print(f"[DEBUG] translate_and_simplify called: target_language={target_language}, lang_name={lang_name}")

        def system_prompt(stronger: bool = False) -> str:
            if stronger:
                return (
                    f"You MUST respond ONLY in {lang_name}. Do not use any English. "
                    f"Translate every word to {lang_name} script. "
                    f"Previous attempt failed. This time output ONLY {lang_name} text with NO English."
                )
            return (
                f"You are a legal expert. Translate and simplify the text into {lang_name} "
                f"at a 6th-grade reading level. Write EVERYTHING in {lang_name} script only. "
                f"Do not mix English. Include Action Items and Deadlines in {lang_name}."
            )

        # First attempt
        print(f"[DEBUG] Sending request to Groq with prompt requesting {lang_name}...")
        response = await self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt(False)},
                {"role": "user", "content": text},
            ],
            model="llama-3.1-8b-instant",
        )
        result = response.choices[0].message.content
        print(f"[DEBUG] Response received, first 150 chars: {result[:150]}")
        print(f"[DEBUG] Response is ASCII-only: {all(ord(c) < 128 for c in result)}")

        # If we asked for non-English but got only ASCII, retry harder
        if target_language != "en" and all(ord(c) < 128 for c in result):
            print(f"[DEBUG] ASCII detected, retrying with stronger prompt for {lang_name}...")
            response = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt(True)},
                    {"role": "user", "content": text},
                ],
                model="llama-3.1-8b-instant",
            )
            result = response.choices[0].message.content
            print(f"[DEBUG] Retry response, first 150 chars: {result[:150]}")

        return result
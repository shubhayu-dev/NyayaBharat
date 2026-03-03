#!/usr/bin/env python3
"""Direct test of Groq API to verify translation is working."""
import asyncio
import os
from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

async def test_groq_translation():
    """Test Groq API directly with different language prompts."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ_API_KEY not set in .env")
        return
    
    print(f"Using Groq API key: {api_key[:20]}...")
    
    client = AsyncGroq(api_key=api_key)
    
    sample_text = "The Ministry of Education has announced new policies for refugee children. All children between 6 and 16 years old are eligible to attend public schools."
    
    test_cases = [
        ("English", "en"),
        ("Hindi", "hi"),
        ("Bengali", "bn"),
        ("Tamil", "ta"),
    ]
    
    for lang_name, lang_code in test_cases:
        print(f"\n{'='*60}")
        print(f"Testing: {lang_name} ({lang_code})")
        print(f"{'='*60}")
        
        system_msg = (
            f"You are a translator. Translate the following text to {lang_name}. "
            f"Write ONLY in {lang_name} script. Do not include any English. "
            f"Output nothing but the {lang_name} translation."
        )
        
        print(f"System prompt: {system_msg[:80]}...")
        
        try:
            response = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": sample_text},
                ],
                model="llama-3.1-8b-instant",
                temperature=0.1,
            )
            
            result = response.choices[0].message.content
            is_ascii = all(ord(c) < 128 for c in result)
            
            print(f"Response: {result[:200]}")
            print(f"Is ASCII-only: {is_ascii}")
            
            if lang_code != "en" and is_ascii:
                print(f"⚠️  WARNING: Requested {lang_name} but got ASCII text!")
            elif lang_code != "en" and not is_ascii:
                print(f"✅ Good: Got non-ASCII text for {lang_name}")
            
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_groq_translation())

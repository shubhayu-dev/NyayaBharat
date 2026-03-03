import asyncio
import os
import base64
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

async def test_vision():
    client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
    with open("test_notice.png", "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
    try:
        response = await client.chat.completions.create(
            model="llama-3.2-90b-vision-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all the text from this image accurately."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            temperature=0,
        )
        print("Response:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_vision())

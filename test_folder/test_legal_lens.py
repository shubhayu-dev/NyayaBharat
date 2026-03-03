import asyncio
import os
from services.legal_lens import LegalLensService # Rename to your actual file

async def verify():
    service = LegalLensService()
    
    # Use a sample image path
    test_image_path = "test_notice.png" 
    
    if not os.path.exists(test_image_path):
        print(f"Error: Place a legal notice image at {test_image_path}")
        return

    print("--- Starting OCR Extraction ---")
    with open(test_image_path, "rb") as f:
        image_data = f.read()
    
    # Test the full pipeline with Hindi (should work)
    result_hi = await service.process_document(image_data, language="hi")
    if result_hi["status"] == "success":
        print("✅ Hindi extraction succeeded")
        print("Sample output:", result_hi["simplified_text"][:100].replace("\n"," "))
    else:
        print(f"❌ Hindi error: {result_hi['message']}")

    # Try Bengali output (OCR reader now includes 'bn')
    result_bn = await service.process_document(image_data, language="bn")
    if result_bn["status"] == "success":
        print("✅ Bengali extraction succeeded")
        print("Sample output:", result_bn["simplified_text"][:100].replace("\n"," "))
    else:
        print(f"❌ Bengali error: {result_bn['message']}")

    # Ask for an unsupported language to verify validation
    result_bad = await service.process_document(image_data, language="xx")
    if result_bad["status"] == "error":
        print(f"✅ Correctly rejected unsupported language: {result_bad['message']}")
    else:
        print("❌ Unsupported language should have been rejected")

if __name__ == "__main__":
    asyncio.run(verify())
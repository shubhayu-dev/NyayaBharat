import logging
import os
logging.disable(logging.CRITICAL)
from paddleocr import PaddleOCR
pipe = PaddleOCR(lang='en', use_textline_orientation=False)
res = pipe.ocr("test_notice.png")
print("OCR outcome:", type(res))
if res and len(res) > 0:
    for line in res[0]:
        print(line)

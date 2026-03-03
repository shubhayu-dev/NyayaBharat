#!/bin/bash
# Test the /api/document/process endpoint directly with a sample image

# Create a simple test image (1x1 pixel PNG with text)
# First, let's create a simple image with text
python3 << 'EOF'
from PIL import Image, ImageDraw
import requests

# Create a simple image with some text
img = Image.new('RGB', (400, 200), color='white')
draw = ImageDraw.Draw(img)
draw.text((10, 10), "The Ministry of Education announces new refugee policies.", fill='black')
img.save('/tmp/test_doc.png')
EOF

echo "Test image created at /tmp/test_doc.png"
echo ""

# Test with Hindi 
echo "Testing with language=hi..."
curl -X POST \
  'http://127.0.0.1:8000/api/document/process' \
  -H 'accept: application/json' \
  -F 'file=@/tmp/test_doc.png' \
  -F 'language=hi' \
  2>/dev/null | python3 -m json.tool | head -50

echo ""
echo ""

# Test with Bengali
echo "Testing with language=bn..."
curl -X POST \
  'http://127.0.0.1:8000/api/document/process' \
  -H 'accept: application/json' \
  -F 'file=@/tmp/test_doc.png' \
  -F 'language=bn' \
  2>/dev/null | python3 -m json.tool | head -50

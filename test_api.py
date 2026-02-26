"""
Test script for NyayaBharat API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health Check:", response.json())

def test_voice_complaint():
    """Test voice complaint endpoint"""
    data = {
        "audio_url": "https://example.com/audio.mp3",
        "language": "hi"
    }
    response = requests.post(f"{BASE_URL}/api/complaint/voice", json=data)
    print("Voice Complaint:", response.json())

def test_legal_query():
    """Test legal rights query endpoint"""
    data = {
        "question": "What are my rights under Article 21?",
        "language": "en"
    }
    response = requests.post(f"{BASE_URL}/api/rights/query", json=data)
    print("Legal Query:", response.json())

if __name__ == "__main__":
    print("Testing NyayaBharat API...\n")
    
    try:
        test_health()
        print()
        test_voice_complaint()
        print()
        test_legal_query()
    except Exception as e:
        print(f"Error: {e}")

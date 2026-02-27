#!/bin/bash

# NyayaBharat Platform - Run Script

echo "Starting NyayaBharat Platform..."

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Run the FastAPI server
python3 app.py

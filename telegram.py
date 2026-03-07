import telebot
import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_BASE_URL = "https://nyayabharat.saturnapi.in"

bot = telebot.TeleBot(TELEGRAM_TOKEN)

# ==========================================
# 1. HANDLE TEXT (Rights Chatbot)
# ==========================================

@bot.message_handler(content_types=['text'])
def handle_text(message):
    msg = bot.reply_to(message, "⚖️ Researching Indian Law...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/rights/query",
            json={"question": message.text, "language": "en"}
        )
        data = response.json()
        bot.edit_message_text(data.get("answer", "Error getting answer"), message.chat.id, msg.message_id)
    except Exception as e:
        bot.edit_message_text(f"API Connection Error: {e}", message.chat.id, msg.message_id)

# ==========================================
# 2. HANDLE PHOTOS (Legal Lens)
# ==========================================

@bot.message_handler(content_types=['photo'])
def handle_photo(message):
    msg = bot.reply_to(message, "📄 Scanning legal document...")
    try:
        # Telegram sends multiple sizes; [-1] is the highest resolution
        file_info = bot.get_file(message.photo[-1].file_id)
        downloaded_file = bot.download_file(file_info.file_path)

        response = requests.post(
            f"{API_BASE_URL}/api/legal-lens/analyze",
            files={"image": ("document.jpg", downloaded_file, "image/jpeg")},
            data={"language": "en"}
        )
        data = response.json()
        bot.edit_message_text(
            data.get("analysis", "Failed to analyze document"),
            message.chat.id,
            msg.message_id
        )
    except Exception as e:
        bot.edit_message_text(f"API Error: {e}", message.chat.id, msg.message_id)

# ==========================================
# 3. HANDLE VOICE NOTES (Voice Complaint)
# Telegram voice notes are OGG/Opus — AWS Transcribe supports OGG natively.
# ==========================================

@bot.message_handler(content_types=['voice'])
def handle_voice(message):
    msg = bot.reply_to(message, "🎙️ Uploading voice complaint to AWS...")
    try:
        file_info = bot.get_file(message.voice.file_id)
        downloaded_file = bot.download_file(file_info.file_path)

        # 1. Start the transcription job.
        #    Send as audio/ogg — AWS Transcribe supports OGG (Opus codec).
        start_res = requests.post(
            f"{API_BASE_URL}/api/complaint/voice",
            files={"file": ("voice.ogg", downloaded_file, "audio/ogg")}
        )
        start_data = start_res.json()

        if start_res.status_code != 200:
            bot.edit_message_text(
                f"❌ Failed to start job: {start_data.get('detail', 'Unknown error')}",
                message.chat.id, msg.message_id
            )
            return

        # Grab the unique job name the API created
        job_name = start_data.get("job_name")
        bot.edit_message_text(
            "⚙️ Audio uploaded. AWS Transcribe is processing… this may take a minute.",
            message.chat.id, msg.message_id
        )

        # 2. Poll the API for that specific job using /result/{job_name}
        max_attempts = 24   # 24 × 5 s = 2 minutes timeout
        for _ in range(max_attempts):
            time.sleep(5)
            result_res = requests.get(f"{API_BASE_URL}/api/complaint/result/{job_name}")
            result_data = result_res.json()
            status = result_data.get("status")

            if status == "COMPLETED":
                native = result_data.get("native_transcript", "—")
                english = result_data.get("english_transcript", "—")
                final_text = (
                    f"✅ *Transcription complete!*\n\n"
                    f"🗣️ *Native Transcript:*\n{native}\n\n"
                    f"🌐 *English Translation:*\n{english}"
                )
                bot.send_message(message.chat.id, final_text, parse_mode="Markdown")
                return

            elif status in ("FAILED", "ERROR"):
                error_detail = result_data.get("error", "No details available.")
                bot.send_message(
                    message.chat.id,
                    f"❌ AWS Transcribe failed: {error_detail}"
                )
                return

            # Still IN_PROGRESS or QUEUED — keep polling

        # Timed out
        bot.send_message(
            message.chat.id,
            "⏱️ Transcription is taking longer than expected. "
            f"You can check manually with job: `{job_name}`",
            parse_mode="Markdown"
        )

    except Exception as e:
        bot.send_message(message.chat.id, f"API Error: {e}")

# ==========================================
# START
# ==========================================
print("Telegram Bot is running and listening for messages...")
bot.infinity_polling()
import streamlit as st
import requests

# Set Page Config
st.set_page_config(page_title="NyayaBharat", page_icon="⚖️", layout="wide")

# Theme / Styling
st.markdown("""
    <style>
    .main { background-color: #f5f7f9; }
    .stButton>button { width: 100%; border-radius: 5px; height: 3em; background-color: #2e4a7d; color: white; }
    </style>
    """, unsafe_allow_html=True)

API_BASE = "http://127.0.0.1:8000"

# Sidebar Navigation
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/3252/3252906.png", width=100)
    st.title("NyayaBharat")
    choice = st.radio("Services", ["Rights Bot", "Legal Lens", "Officer Mode", "Voice Filing"])
    st.info("Hackathon Prototype v1.0")

# --- UI LOGIC ---
if choice == "Rights Bot":
    st.header("🤖 Legal Rights Assistant")
    q = st.text_input("Ask about your rights...")
    if st.button("Get Legal Advice"):
        res = requests.post(f"{API_BASE}/api/rights/query", json={"question": q}).json()
        st.write(f"**Answer:** {res['answer']}")
        st.caption(f"Citations: {res['citations'][0]['source']} Art. {res['citations'][0]['article']}")

elif choice == "Legal Lens":
    st.header("🔍 Legal Lens: Document Simplifier")
    up = st.file_uploader("Upload Legal Notice", type=['jpg', 'pdf'])
    if up and st.button("Simplify"):
        files = {"file": up.getvalue()}
        res = requests.post(f"{API_BASE}/api/document/process", files=files, data={"language": "en"}).json()
        st.subheader("What this means:")
        st.write(res['simplified_text'])
        col1, col2 = st.columns(2)
        col1.metric("Deadlines", res['deadlines'][0])
        col2.write("**Actions:** " + ", ".join(res['action_items']))

elif choice == "Officer Mode":
    st.header("👮 Government Officer Portal")
    up = st.file_uploader("Upload Vernacular Petition", type=['jpg'])
    if up and st.button("Generate Official Translation"):
        files = {"file": up.getvalue()}
        res = requests.post(f"{API_BASE}/api/officer/translate", files=files).json()
        st.text_area("Formal Document Output", res['formal_translation'], height=250)
        st.success(f"Confidence: {res['confidence_score']*100}%")

elif choice == "Voice Filing":
    st.header("🎤 Voice Complaint Filing")
    st.write("Record or provide a voice link to file a complaint automatically.")
    url = st.text_input("Audio Source URL", "http://storage.nyaya.in/audio1.mp3")
    if st.button("Process Voice Complaint"):
        res = requests.post(f"{API_BASE}/api/complaint/voice", json={"audio_url": url}).json()
        st.success(f"Complaint Registered! ID: {res['tracking_id']}")
        st.json(res)
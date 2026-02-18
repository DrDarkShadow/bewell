import os
import streamlit as st

from config import WHISPER_MODEL
from summarizer import generate_medical_summary
from storage import save_summary, save_transcript
from transcriber import WhisperTranscriber


st.set_page_config(page_title="Voice Transcript", page_icon="🎤", layout="centered")

st.markdown(
    """
    <style>
    .stApp { background: linear-gradient(180deg, #f1f5ff 0%, #f8fafc 45%, #ffffff 100%); }
    .block-container { padding-top: 2.5rem; padding-bottom: 3rem; }
    .app-title { font-size: 2.4rem; font-weight: 800; background: linear-gradient(90deg, #2563eb, #7c3aed); -webkit-background-clip: text; color: transparent; margin-bottom: 0.25rem; }
    .app-subtitle { color: #64748b; margin-bottom: 1.25rem; }
    .accent-bar { height: 6px; width: 140px; border-radius: 999px; background: linear-gradient(90deg, #22c55e, #06b6d4); margin: 0.25rem 0 1.25rem 0; }
    .card { padding: 1.2rem; border-radius: 16px; background: linear-gradient(180deg, #0b1220, #111827); border: 1px solid #1f2937; color: #e2e8f0; box-shadow: 0 12px 30px rgba(2, 6, 23, 0.25); }
    .section-title { font-size: 1.05rem; font-weight: 700; color: #334155; margin-bottom: 0.5rem; }
    .status-good { border-radius: 12px; padding: 0.75rem 1rem; background: #ecfdf3; color: #166534; border: 1px solid #bbf7d0; }
    .footer { color: #64748b; font-size: 0.85rem; margin-top: 1.5rem; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown("<div class='app-title'>Voice Transcript</div>", unsafe_allow_html=True)
st.markdown("<div class='app-subtitle'>Doctor–patient conversation, transcribed locally.</div>", unsafe_allow_html=True)
st.markdown("<div class='accent-bar'></div>", unsafe_allow_html=True)


@st.cache_resource
def get_transcriber(model_name: str, cache_key: float):
    return WhisperTranscriber(model_name)


if "segments" not in st.session_state:
    st.session_state.segments = []
if "doctor_key" not in st.session_state:
    st.session_state.doctor_key = 0
if "patient_key" not in st.session_state:
    st.session_state.patient_key = 0


left, right = st.columns(2)
with left:
    st.markdown("<div class='section-title'>Doctor</div>", unsafe_allow_html=True)
    doctor_audio = st.audio_input("Record Doctor", key=f"doctor_{st.session_state.doctor_key}")
    if doctor_audio is not None:
        st.audio(doctor_audio)
        if st.button("Add Doctor Clip", key=f"add_doctor_{st.session_state.doctor_key}"):
            st.session_state.segments.append({"speaker": "Doctor", "audio": doctor_audio.getvalue()})
            st.session_state.doctor_key += 1
            st.rerun()

with right:
    st.markdown("<div class='section-title'>Patient</div>", unsafe_allow_html=True)
    patient_audio = st.audio_input("Record Patient", key=f"patient_{st.session_state.patient_key}")
    if patient_audio is not None:
        st.audio(patient_audio)
        if st.button("Add Patient Clip", key=f"add_patient_{st.session_state.patient_key}"):
            st.session_state.segments.append({"speaker": "Patient", "audio": patient_audio.getvalue()})
            st.session_state.patient_key += 1
            st.rerun()

if st.session_state.segments:
    st.markdown("<div class='status-good'>Clips added. Continue recording or transcribe.</div>", unsafe_allow_html=True)
    if st.button("Clear All Clips"):
        st.session_state.segments = []
        st.session_state.doctor_key += 1
        st.session_state.patient_key += 1
        st.rerun()

if st.session_state.segments and st.button("Transcribe & Summarize"):
    with st.spinner("Transcribing..."):
        transcriber_mtime = os.path.getmtime(os.path.join(os.path.dirname(__file__), "transcriber.py"))
        transcriber = get_transcriber(WHISPER_MODEL, transcriber_mtime)
        lines = []
        for segment in st.session_state.segments:
            text = transcriber.transcribe_bytes(segment["audio"])
            lines.append(f"{segment['speaker']}: {text}")

    transcript = "\n".join(lines)
    st.markdown("<div class='section-title'>Transcript</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='card'>{transcript}</div>", unsafe_allow_html=True)

    with st.spinner("Generating summary..."):
        summary = generate_medical_summary(transcript)

    st.markdown("<div class='section-title'>Medical Summary</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='card'>{summary}</div>", unsafe_allow_html=True)

    transcript_path = save_transcript(transcript)
    summary_path = save_summary(summary)
    st.success(f"Transcript saved at: {transcript_path}")
    st.success(f"Summary saved at: {summary_path}")

st.markdown("<div class='footer'>Local, private processing • Whisper transcription</div>", unsafe_allow_html=True)

"""
Whisper Model Server — runs independently on port 6000.
Loads Whisper, RoBERTa Sentiment, and GoEmotions ONCE.
Backend can restart freely without reloading any of these models.

Start this ONCE:
    python backend/model_server/server.py
"""

import io
import os
import sys
import logging
import warnings

# Prevent PyTorch thread deadlocks on Windows CPU
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

import numpy as np
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [model-server] %(message)s")

# ---------------------------------------------------------------------------
# Optional audio decoders
# ---------------------------------------------------------------------------
try:
    import soundfile as sf
except ImportError:
    sf = None

try:
    import av
except ImportError:
    av = None

# ---------------------------------------------------------------------------
# 1. Whisper model
# ---------------------------------------------------------------------------
import whisper

WHISPER_MODEL_SIZE = "base"
logger.info(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model…")
_whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
logger.info("✅ Whisper model ready.")

# ---------------------------------------------------------------------------
# 2. RoBERTa Sentiment + GoEmotions models
# ---------------------------------------------------------------------------
# Add project root to path so model_fusion can be imported
_project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_backend_src = os.path.join(_project_root, "backend", "src")
for _p in [_project_root, _backend_src]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from agent.chatbot.model_fusion import StressScoreCalculator

# ---------------------------------------------------------------------------
# 3. Database schema check
# ---------------------------------------------------------------------------
logger.info("Checking database schema…")
try:
    from config.database import engine, Base
    import models  # registers all ORM models with Base
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database schema ready.")
except Exception as _db_exc:
    logger.warning(f"⚠️  DB schema check failed: {_db_exc} — backend will handle it.")

logger.info("Loading RoBERTa Sentiment + GoEmotions models…")
_stress_calculator = StressScoreCalculator()
_stress_calculator.initialize()
logger.info("✅ Sentiment + Emotion models ready.")

# ---------------------------------------------------------------------------
# Audio decoding helpers
# ---------------------------------------------------------------------------

def _decode_audio_bytes(audio_bytes: bytes) -> np.ndarray:
    if av is not None:
        try:
            frames = []
            with av.open(io.BytesIO(audio_bytes)) as container:
                stream = container.streams.audio[0]
                resampler = av.audio.resampler.AudioResampler(
                    format="s16", layout="mono", rate=16000
                )
                for frame in container.decode(stream):
                    for outframe in resampler.resample(frame):
                        arr = outframe.to_ndarray()
                        arr = (
                            np.clip(arr, -1.0, 1.0)
                            if arr.dtype.kind == "f"
                            else arr.astype(np.float32) / 32768.0
                        )
                        if arr.ndim > 1:
                            arr = arr.mean(axis=0)
                        frames.append(arr)
                for outframe in resampler.resample(None):
                    arr = outframe.to_ndarray().astype(np.float32) / 32768.0
                    if arr.ndim > 1:
                        arr = arr.mean(axis=0)
                    frames.append(arr)
            if frames:
                return np.concatenate(frames)
        except Exception as exc:
            logger.warning(f"av decoding failed: {exc}")

    if sf is not None:
        data, _ = sf.read(io.BytesIO(audio_bytes), dtype="float32", always_2d=False)
        if data.ndim > 1:
            data = np.mean(data, axis=1)
        return data

    raise RuntimeError("No audio decoder available — install soundfile or av.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="BeWell Model Server", version="1.0.0")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "whisper": WHISPER_MODEL_SIZE,
            "sentiment": "cardiffnlp/twitter-roberta-base-sentiment-latest",
            "emotion": "SamLowe/roberta-base-go_emotions",
        }
    }


# ── Transcription ──────────────────────────────────────────────────────────

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """Transcribe audio bytes → text via Whisper."""
    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 1000:
        return {"text": ""}
    try:
        audio_arr = _decode_audio_bytes(audio_bytes)
        audio_arr = np.asarray(audio_arr, dtype=np.float32)
        if len(audio_arr) < 1600:
            return {"text": ""}
        result = _whisper_model.transcribe(audio_arr, fp16=False, language="en")
        return {"text": result["text"].strip()}
    except Exception as exc:
        logger.error(f"Transcription error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ── Stress / Emotion analysis ──────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str


@app.post("/analyze-stress")
def analyze_stress(payload: AnalyzeRequest):
    """
    Run RoBERTa sentiment + GoEmotions on text and return fused stress result.
    Called by emotion_tool.py in the chatbot agent.
    """
    try:
        result = _stress_calculator.calculate_stress(payload.text)
        return result.to_dict()
    except Exception as exc:
        logger.error(f"Stress analysis error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=6000, reload=False)

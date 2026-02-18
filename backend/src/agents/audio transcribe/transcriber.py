import io

import whisper

try:
    import numpy as np
except Exception:  # pragma: no cover - optional dependency
    np = None

try:
    import soundfile as sf
except Exception:  # pragma: no cover - optional dependency
    sf = None

try:
    import av
except Exception:  # pragma: no cover - optional dependency
    av = None

class WhisperTranscriber:
    def __init__(self, model_size="base"):
        print("🔄 Loading Whisper model...")
        self.model = whisper.load_model(model_size)

    def transcribe(self, audio_path: str) -> str:
        if sf is None or np is None:
            raise RuntimeError("soundfile/numpy not available. Install dependencies to avoid ffmpeg.")

        audio, _ = sf.read(audio_path, dtype="float32")
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)

        audio = np.asarray(audio, dtype=np.float32)
        result = self.model.transcribe(audio, fp16=False, language="en")
        return result["text"].strip()

    def transcribe_bytes(self, audio_bytes: bytes) -> str:
        audio = _decode_audio_bytes(audio_bytes)
        audio = np.asarray(audio, dtype=np.float32)
        result = self.model.transcribe(audio, fp16=False, language="en")
        return result["text"].strip()


def _decode_audio_bytes(audio_bytes: bytes) -> "np.ndarray":
    if np is None:
        raise RuntimeError("numpy not available")

    if sf is not None:
        data, _ = sf.read(io.BytesIO(audio_bytes), dtype="float32", always_2d=False)
        if data.ndim > 1:
            data = np.mean(data, axis=1)
        return data

    if av is not None:
        frames = []
        with av.open(io.BytesIO(audio_bytes)) as container:
            stream = container.streams.audio[0]
            for frame in container.decode(stream):
                arr = frame.to_ndarray()
                if arr.dtype.kind == "f":
                    arr = np.clip(arr, -1.0, 1.0)
                else:
                    arr = arr.astype(np.float32) / 32768.0
                if arr.ndim > 1:
                    arr = arr.mean(axis=0)
                frames.append(arr)
        if not frames:
            raise ValueError("No audio frames decoded")
        return np.concatenate(frames)

    raise RuntimeError("No audio decoder available. Install soundfile or av.")

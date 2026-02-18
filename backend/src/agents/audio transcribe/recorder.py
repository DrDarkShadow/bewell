import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
from config import SAMPLE_RATE

def record_audio(filename: str, duration: int):
    print(f"🎙️ Recording for {duration} seconds...")
    audio = sd.rec(
        int(duration * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="int16"
    )
    sd.wait()
    write(filename, SAMPLE_RATE, audio)
    print("✅ Recording saved")

import re


def _find_keywords(text: str, keywords):
    found = [k for k in keywords if re.search(rf"\b{k}\b", text, re.IGNORECASE)]
    return ", ".join(found) if found else "Not mentioned"


def generate_medical_summary(transcript: str) -> str:
    cleaned = " ".join(transcript.split())

    symptoms = _find_keywords(
        cleaned,
        ["fever", "cough", "headache", "pain", "nausea", "vomiting", "sore", "fatigue", "dizzy"],
    )
    meds = _find_keywords(cleaned, ["paracetamol", "acetaminophen", "ibuprofen", "antibiotic"])

    return (
        "Chief Complaint:\n"
        f"- {symptoms}\n\n"
        "Symptoms:\n"
        f"- {symptoms}\n\n"
        "Medications:\n"
        f"- {meds}\n\n"
        "Advice:\n"
        "- Based on doctor guidance in the transcript\n"
    )

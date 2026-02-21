"""
Medical Summary Generation using AWS Bedrock

This module generates medical summaries from transcriptions using AWS Bedrock models
with context-aware analysis instead of keyword matching.
"""

import json
import os
from typing import Optional

import boto3

import sys

# Ensure backend root is in path to import settings
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if backend_root not in sys.path:
    sys.path.append(backend_root)

from backend.src.config.settings import settings

# Initialize Bedrock client
bedrock_client = boto3.client(
    "bedrock-runtime",
    region_name=settings.AWS_REGION
)

# Default model
DEFAULT_MODEL = settings.BEDROCK_MODEL_ID

MENTAL_HEALTH_SUMMARY_PROMPT = """You are a mental health assistant specialized in summarizing clinician-patient conversations.
Analyze the transcript and produce a concise mental health summary in 5-7 bullet points.

Include only the most clinically relevant mental health details:
1. Presenting concerns and key symptoms
2. Mood, affect, and cognition (if mentioned)
3. Risk assessment (self-harm, harm to others, safety concerns)
4. Relevant psychiatric history, medications, or therapy
5. Psychosocial stressors and supports
6. Assessment/diagnosis and plan/follow-up

Avoid non-mental-health medical details unless they directly affect mental health. Omit any category that is not supported by the transcript; do not say "unclear" or "not mentioned." Keep the total length under 120 words.

Transcript:
{transcript}

Concise Mental Health Summary:"""

GENERAL_MEDICAL_SUMMARY_PROMPT = """You are a medical assistant specialized in summarizing clinician-patient conversations.
Analyze the transcript and produce a concise medical summary in 5-7 bullet points.

Include only the most clinically relevant details:
1. Chief complaint and key symptoms
2. Pertinent medical history
3. Exam findings (if mentioned)
4. Assessment/diagnosis
5. Treatment plan and follow-up

Keep the total length under 120 words.

Transcript:
{transcript}

Concise Medical Summary:"""

TREATMENT_PLAN_PROMPT = """You are a clinical documentation and treatment planning assistant for a mental health platform.

Your task is to analyze a full doctor-patient consultation transcript and generate a structured mental health treatment plan.

CRITICAL RULES:

1. Only extract decisions, diagnoses, and recommendations explicitly stated by the DOCTOR.
2. Do NOT invent any diagnosis, medication, or therapy.
3. Do NOT assume medical intent if it is not clearly stated.
4. If information is unclear or not present, return null.
5. Focus ONLY on mental health conditions.
6. If suicidal ideation, self-harm intent, or severe risk is mentioned, mark risk_level as "HIGH".
7. Do NOT add medical advice beyond what the doctor stated.
8. Ignore casual conversation and greetings.

---

Return output strictly in this JSON format:

{{
    "diagnosis": "",
    "severity": "",
    "identified_symptoms": [],
    "duration_of_condition": "",
    "medications_prescribed": [
        {{
            "name": "",
            "dosage": "",
            "frequency": ""
        }}
    ],
    "therapy_recommended": [],
    "lifestyle_recommendations": [],
    "treatment_goals": [],
    "risk_level": "LOW | MODERATE | HIGH",
    "follow_up_plan": "",
    "doctor_summary": ""
}}

---

Definitions:

- diagnosis -> Primary mental health diagnosis given by doctor.
- severity -> Mild / Moderate / Severe (only if explicitly mentioned).
- identified_symptoms -> Symptoms discussed and acknowledged clinically.
- medications_prescribed -> Only include if doctor explicitly prescribed.
- therapy_recommended -> CBT, DBT, exposure therapy, etc.
- risk_level:
        HIGH -> suicide/self-harm ideation present
        MODERATE -> passive distress but no direct self-harm
        LOW -> no risk indicators
- doctor_summary -> 3-5 line professional summary of doctor's clinical decision.

---

Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def generate_medical_summary(
    transcript: str,
    model_id: Optional[str] = None,
    custom_prompt: Optional[str] = None
) -> str:
    """
    Generate a medical summary from a transcript using AWS Bedrock.
    
    Args:
        transcript: The doctor-patient conversation transcript
        model_id: AWS Bedrock model ID (default: Claude 3.5 Sonnet)
        custom_prompt: Custom prompt template (default: medical summary prompt)
    
    Returns:
        Generated medical summary
        
    Raises:
        RuntimeError: If AWS credentials or Bedrock access is not configured
        ValueError: If transcript is empty
    """
    
    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty")
    
    if model_id is None:
        model_id = DEFAULT_MODEL
    
    if custom_prompt is None:
        custom_prompt = MENTAL_HEALTH_SUMMARY_PROMPT
    
    # Prepare the prompt
    prompt = custom_prompt.format(transcript=transcript)
    
    try:
        # Call Bedrock model
        if "nova" in model_id.lower():
            # Amazon Nova models
            response = bedrock_client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps({
                    "schemaVersion": "messages-v1",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ],
                    "inferenceConfig": {
                        "maxTokens": 256,
                        "temperature": 0.2
                    }
                })
            )
            
            response_body = json.loads(response["body"].read().decode("utf-8"))
            summary = response_body["output"]["message"]["content"][0]["text"]
            
        elif "claude" in model_id.lower():
            # Claude models
            response = bedrock_client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-06-01",
                    "max_tokens": 512,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                })
            )
            
            response_body = json.loads(response["body"].read().decode("utf-8"))
            summary = response_body["content"][0]["text"]
            
        elif "llama" in model_id.lower():
            # Llama models
            response = bedrock_client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps({
                    "prompt": prompt,
                    "max_gen_len": 2048,
                    "temperature": 0.7,
                    "top_p": 0.9
                })
            )
            
            response_body = json.loads(response["body"].read().decode("utf-8"))
            summary = response_body["generation"]
            
        elif "mistral" in model_id.lower():
            # Mistral models
            response = bedrock_client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens": 2048,
                    "temperature": 0.7
                })
            )
            
            response_body = json.loads(response["body"].read().decode("utf-8"))
            summary = response_body["outputs"][0]["text"]
            
        else:
            # Generic model invocation
            response = bedrock_client.invoke_model(
                modelId=model_id,
                body=prompt.encode("utf-8")
            )
            
            response_body = json.loads(response["body"].read().decode("utf-8"))
            summary = response_body.get("summary", str(response_body))
        
        return summary.strip()
        
    except Exception as e:
        raise RuntimeError(f"Failed to generate summary using Bedrock: {str(e)}")


def generate_summary_with_custom_prompt(
    transcript: str,
    custom_prompt: str,
    model_id: Optional[str] = None
) -> str:
    """
    Generate a summary using a custom prompt.
    
    Args:
        transcript: The transcript to summarize
        custom_prompt: Custom prompt template with {transcript} placeholder
        model_id: AWS Bedrock model ID
    
    Returns:
        Generated summary
    """
    return generate_medical_summary(transcript, model_id, custom_prompt)


def generate_treatment_plan(
    transcript: str,
    model_id: Optional[str] = None
) -> str:
    """
    Generate a structured mental health treatment plan using the treatment prompt.

    Args:
        transcript: The doctor-patient conversation transcript
        model_id: AWS Bedrock model ID

    Returns:
        Generated treatment plan JSON as text
    """
    return generate_medical_summary(transcript, model_id, TREATMENT_PLAN_PROMPT)


def list_available_models() -> list:
    """
    List available Bedrock models.
    
    Returns:
        List of available model IDs
    """
    try:
        bedrock = boto3.client(
            "bedrock",
            region_name=settings.AWS_REGION
        )
        response = bedrock.list_foundation_models()
        models = [model["modelId"] for model in response.get("modelSummaries", [])]
        return models
    except Exception as e:
        print(f"Warning: Could not list models: {str(e)}")
        return [DEFAULT_MODEL]

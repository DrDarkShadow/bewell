import os
import uuid

from config import AWS_REGION, S3_BUCKET, LOCAL_SUMMARY_DIR

try:
    import boto3
except Exception:  # pragma: no cover - optional dependency
    boto3 = None

def save_summary(summary: str):
    if boto3 is not None and S3_BUCKET:
        s3 = boto3.client("s3", region_name=AWS_REGION)
        key = f"summaries/{uuid.uuid4()}.txt"
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=summary.encode("utf-8")
        )
        return f"s3://{S3_BUCKET}/{key}"

    os.makedirs(LOCAL_SUMMARY_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}.txt"
    file_path = os.path.join(LOCAL_SUMMARY_DIR, filename)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(summary)
    return file_path


def save_transcript(transcript: str):
    os.makedirs(LOCAL_SUMMARY_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}_transcript.txt"
    file_path = os.path.join(LOCAL_SUMMARY_DIR, filename)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(transcript)
    return file_path

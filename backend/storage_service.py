"""
Cloudflare R2 Object Storage Service
Handles file uploads/downloads using R2's S3-compatible API
"""
import os
import logging
from typing import Optional, Tuple

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

R2_BUCKET = os.environ.get("R2_BUCKET_NAME")

_client = None


def init_storage():
    """
    Initialize the R2 client. Call once at startup; idempotent.
    Returns the boto3 S3 client (kept for parity with the previous
    init_storage() -> storage_key interface; callers don't need the value).
    """
    global _client

    if _client:
        return _client

    endpoint = os.environ.get("R2_ENDPOINT_URL")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")

    if not (endpoint and access_key and secret_key and R2_BUCKET):
        raise ValueError("R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY or R2_BUCKET_NAME not configured in environment")

    _client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
    logger.info("Cloudflare R2 storage initialized successfully")
    return _client


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """
    Upload file to storage. Overwrites silently if path exists.

    Args:
        path: Storage path (e.g., "metaqi-academy/uploads/user123/abc.jpg")
        data: File content as bytes
        content_type: MIME type (e.g., "image/jpeg")

    Returns:
        dict: {"path": str, "size": int, "etag": str}
    """
    client = init_storage()

    try:
        resp = client.put_object(Bucket=R2_BUCKET, Key=path, Body=data, ContentType=content_type)
        return {"path": path, "size": len(data), "etag": resp.get("ETag", "").strip('"')}
    except ClientError as e:
        logger.error(f"Failed to upload object: {e}")
        raise Exception(f"Storage upload failed: {str(e)}")


def get_object(path: str) -> Tuple[bytes, str]:
    """
    Download file from storage.

    Args:
        path: Storage path

    Returns:
        tuple: (content_bytes, content_type)
    """
    client = init_storage()

    try:
        resp = client.get_object(Bucket=R2_BUCKET, Key=path)
        content_type = resp.get("ContentType", "application/octet-stream")
        return resp["Body"].read(), content_type
    except ClientError as e:
        logger.error(f"Failed to download object: {e}")
        raise Exception(f"Storage download failed: {str(e)}")

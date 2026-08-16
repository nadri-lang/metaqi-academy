"""
Emergent Object Storage Service
Handles file uploads/downloads using the Emergent Storage API
"""
import os
import requests
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Configuration
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "metaqi-academy"

# Module-level storage key (initialized once, reused globally)
storage_key: Optional[str] = None


def init_storage() -> str:
    """
    Initialize storage connection. Call ONCE at startup.
    Idempotent - returns a reusable storage_key.
    """
    global storage_key
    
    if storage_key:
        return storage_key
    
    if not EMERGENT_KEY:
        raise ValueError("EMERGENT_LLM_KEY not configured in environment")
    
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Emergent Object Storage initialized successfully")
        return storage_key
    except requests.RequestException as e:
        logger.error(f"Failed to initialize storage: {e}")
        raise


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """
    Upload file to storage. Overwrites silently if path exists.
    
    Args:
        path: Storage path (e.g., "metaqi-academy/uploads/user123/abc.jpg")
        data: File content as bytes
        content_type: MIME type (e.g., "image/jpeg")
    
    Returns:
        dict: {"path": str, "size": int, "etag": str}
    
    Raises:
        HTTPException: If upload fails
    """
    key = init_storage()
    
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={
                "X-Storage-Key": key,
                "Content-Type": content_type
            },
            data=data,
            timeout=120
        )
        
        # Handle specific error codes
        if resp.status_code == 402:
            raise Exception("Out of storage credits. Please add more credits to continue uploading files.")
        elif resp.status_code == 403:
            raise Exception("Storage integration is disabled or key is inactive.")
        elif resp.status_code == 503:
            # Stale key - reset and retry once
            global storage_key
            storage_key = None
            logger.warning("Storage key stale, resetting...")
            return put_object(path, data, content_type)
        
        resp.raise_for_status()
        return resp.json()
    
    except requests.RequestException as e:
        logger.error(f"Failed to upload object: {e}")
        raise Exception(f"Storage upload failed: {str(e)}")


def get_object(path: str) -> Tuple[bytes, str]:
    """
    Download file from storage.
    
    Args:
        path: Storage path
    
    Returns:
        tuple: (content_bytes, content_type)
    
    Raises:
        HTTPException: If download fails
    """
    key = init_storage()
    
    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60
        )
        
        # Handle specific error codes
        if resp.status_code == 503:
            # Stale key - reset and retry once
            global storage_key
            storage_key = None
            logger.warning("Storage key stale, resetting...")
            return get_object(path)
        
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "application/octet-stream")
        return resp.content, content_type
    
    except requests.RequestException as e:
        logger.error(f"Failed to download object: {e}")
        raise Exception(f"Storage download failed: {str(e)}")

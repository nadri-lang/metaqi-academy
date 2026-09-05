"""
Translation service using OpenAI GPT via a direct OpenAI API key
Automatically translates content from Spanish to target language
"""
import hashlib
import logging
import os
from typing import Optional, Dict
from openai import AsyncOpenAI, RateLimitError
import asyncio
from dotenv import load_dotenv

from database import db

load_dotenv()

logger = logging.getLogger(__name__)

_client: Optional[AsyncOpenAI] = None

# A single page load can trigger dozens of sequential/concurrent translation
# calls (one per field, per list item). A freshly-created API key usually
# sits on a low rate-limit tier, so the first call (always a short "title")
# succeeds while the rest queue up and get 429'd - which the except-and-
# fall-back-to-original-text logic below then hides as "not translating".
# Capping concurrency and letting the SDK's own retry/backoff absorb 429s
# fixes that without needing to know the account's exact tier.
_CONCURRENCY_LIMIT = 3
_semaphore = asyncio.Semaphore(_CONCURRENCY_LIMIT)


def _get_client() -> Optional[AsyncOpenAI]:
    """Lazily build the OpenAI client so a missing key doesn't crash import."""
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    _client = AsyncOpenAI(api_key=api_key, max_retries=5)
    return _client

# Language mapping
LANGUAGE_NAMES = {
    "es": "Spanish",
    "en": "English",
    "fr": "French",
    "de": "German",
    "ro": "Romanian"
}

# In-process L1 cache, keyed by a hash of the *full* source text (not a
# truncated prefix - short prefixes collide across distinct texts that share
# an opening sentence, e.g. templated daily-energy copy, silently serving one
# item's translation for another). Backed by the `translation_cache` Mongo
# collection (see _cache_get/_cache_set) so translations survive a redeploy
# instead of being re-requested from OpenAI - and potentially re-flawed - by
# every restart's cold-cache stampede.
_translation_cache: Dict[str, str] = {}


def _cache_key(text: str, target_lang: str) -> str:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"{digest}_{target_lang}"


async def _cache_get(key: str) -> Optional[str]:
    if key in _translation_cache:
        return _translation_cache[key]
    doc = await db.translation_cache.find_one({"_id": key})
    if doc:
        _translation_cache[key] = doc["translated"]
        return doc["translated"]
    return None


async def _cache_set(key: str, text: str, target_lang: str, translated: str) -> None:
    _translation_cache[key] = translated
    try:
        await db.translation_cache.update_one(
            {"_id": key},
            {"$set": {"text": text, "target_lang": target_lang, "translated": translated}},
            upsert=True,
        )
    except Exception as e:
        # Persisting is a durability nice-to-have; the L1 dict already has it
        # for this process, so a Mongo hiccup shouldn't fail the translation.
        logger.error(f"Failed to persist translation cache entry: {e}")

async def translate_text(text: str, target_lang: str, source_lang: str = "es") -> str:
    """
    Translate text from source language to target language using GPT
    
    Args:
        text: Text to translate
        target_lang: Target language code (es, en, fr, de, ro)
        source_lang: Source language code (default: es)
    
    Returns:
        Translated text
    """
    # If target is same as source, return original
    if target_lang == source_lang:
        return text
    
    # Check cache
    cache_key = _cache_key(text, target_lang)
    cached = await _cache_get(cache_key)
    if cached is not None:
        return cached
    
    # Get API key
    client = _get_client()
    if client is None:
        logger.warning("OPENAI_API_KEY not found, returning original text")
        return text

    # Get language names
    source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)

    try:
        # Each call is a fresh, independent completion - translate_list_of_dicts
        # fires many of these concurrently via asyncio.gather, and a stateful
        # chat session shared across calls previously bled prior/sibling texts
        # into each other's context. Plain chat completions carry no history
        # between calls, so concurrent calls can't cross-contaminate.
        async with _semaphore:
            response = await client.chat.completions.create(
                model="gpt-5.4-mini",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a professional translator. Translate the following text from {source_name} to {target_name}. Maintain the tone, style and formatting. Return ONLY the translation, nothing else."
                    },
                    {"role": "user", "content": text},
                ],
            )
        translated = response.choices[0].message.content.strip()

        # Cache the result
        await _cache_set(cache_key, text, target_lang, translated)

        return translated

    except RateLimitError as e:
        logger.error(f"Translation rate-limited after {client.max_retries} SDK retries "
                     f"(field len={len(text)} chars, target={target_lang}): {e}")
        return text  # Return original on error
    except Exception as e:
        logger.error(f"Translation error (target={target_lang}): {e}")
        return text  # Return original on error


async def translate_dict(data: Dict, target_lang: str, fields_to_translate: list) -> Dict:
    """
    Translate specific fields in a dictionary
    
    Args:
        data: Dictionary with content
        target_lang: Target language code
        fields_to_translate: List of field names to translate
    
    Returns:
        Dictionary with translated fields
    """
    if target_lang == "es":
        return data
    
    translated_data = data.copy()
    
    for field in fields_to_translate:
        if field in data and data[field]:
            translated_data[field] = await translate_text(data[field], target_lang)
    
    return translated_data


async def translate_list_of_dicts(items: list, target_lang: str, fields_to_translate: list) -> list:
    """
    Translate specific fields in a list of dictionaries
    """
    if target_lang == "es":
        return items
    
    tasks = [translate_dict(item, target_lang, fields_to_translate) for item in items]
    return await asyncio.gather(*tasks)

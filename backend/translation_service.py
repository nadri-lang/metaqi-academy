"""
Translation service using OpenAI GPT via a direct OpenAI API key
Automatically translates content from Spanish to target language
"""
import os
from typing import Optional, Dict
from openai import AsyncOpenAI
import asyncio
from dotenv import load_dotenv

load_dotenv()

_client: Optional[AsyncOpenAI] = None


def _get_client() -> Optional[AsyncOpenAI]:
    """Lazily build the OpenAI client so a missing key doesn't crash import."""
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    _client = AsyncOpenAI(api_key=api_key)
    return _client

# Language mapping
LANGUAGE_NAMES = {
    "es": "Spanish",
    "en": "English",
    "fr": "French",
    "de": "German",
    "ro": "Romanian"
}

# In-memory cache for translations
# Format: {f"{text[:50]}_{target_lang}": "translated_text"}
_translation_cache: Dict[str, str] = {}

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
    cache_key = f"{text[:100]}_{target_lang}"
    if cache_key in _translation_cache:
        return _translation_cache[cache_key]
    
    # Get API key
    client = _get_client()
    if client is None:
        print("Warning: OPENAI_API_KEY not found, returning original text")
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
        _translation_cache[cache_key] = translated

        return translated

    except Exception as e:
        print(f"Translation error: {e}")
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

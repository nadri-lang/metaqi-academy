"""
Translation service using OpenAI GPT via Emergent LLM Key
Automatically translates content from Spanish to target language
"""
import os
from typing import Optional, Dict
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
from dotenv import load_dotenv

load_dotenv()

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
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("Warning: EMERGENT_LLM_KEY not found, returning original text")
        return text
    
    # Get language names
    source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    
    try:
        # Initialize chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"translate_{target_lang}",
            system_message=f"You are a professional translator. Translate the following text from {source_name} to {target_name}. Maintain the tone, style and formatting. Return ONLY the translation, nothing else."
        ).with_model("openai", "gpt-5.4-mini")
        
        # Create message
        user_message = UserMessage(text=text)
        
        # Get translation (non-streaming for simplicity)
        response = await chat.send_message(user_message)
        translated = response.strip()
        
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

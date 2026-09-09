"""
I Ching interpretation synthesis via the Claude API (direct Anthropic key).

Strictly grounded: the system prompt forbids drawing on the model's own
general I Ching knowledge - the synthesis must come only from the classical
texts (Dictamen/Imagen/line commentary) passed in as context, sourced from
the user's own hexagramas.json corpus.

Kept on Anthropic deliberately, separate from translation_service.py's
OpenAI account: splitting providers means one account running out of
credit (has already happened once with OpenAI) doesn't take down both
features at once, and Claude reads better on this warm, literary Spanish
synthesis task than GPT does.
"""
import logging
import os
from typing import Optional

from anthropic import AsyncAnthropic, APIError, APIConnectionError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ICHING_MODEL = "claude-sonnet-5"

_client: Optional[AsyncAnthropic] = None

SYSTEM_PROMPT = (
    "Eres un asistente que sintetiza consultas del I Ching (Yijing) para la "
    "aplicación MetaQi Academy. Debes basarte ESTRICTAMENTE en los textos "
    "clásicos (Dictamen, Imagen y líneas) que se te proporcionan a "
    "continuación - nunca uses tu propio conocimiento general sobre el I "
    "Ching, ni añadas interpretaciones, símbolos o datos que no estén "
    "presentes en esos textos. Tu tarea es sintetizar y conectar esos "
    "textos con la pregunta concreta que la persona ha formulado, en un "
    "tono cálido y claro, en español, en 2-4 párrafos breves. Si no se "
    "proporcionó una pregunta, sintetiza el significado general de la "
    "lectura tal como surge de los textos entregados."
)


class InterpretationError(Exception):
    """Raised when the interpretation could not be generated - message is safe to show the user."""


def _get_client() -> Optional[AsyncAnthropic]:
    """Lazily build the Anthropic client so a missing key doesn't crash import."""
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    _client = AsyncAnthropic(api_key=api_key, max_retries=1, timeout=30.0)
    return _client


async def interpret_iching(question: Optional[str], context: str) -> str:
    client = _get_client()
    if client is None:
        raise InterpretationError(
            "El servicio de interpretación no está configurado (falta ANTHROPIC_API_KEY)."
        )

    user_message = (
        (f"Pregunta de la persona: {question.strip()}\n\n" if question and question.strip() else "")
        + "Textos clásicos de esta lectura:\n\n"
        + context
    )

    try:
        response = await client.messages.create(
            model=ICHING_MODEL,
            max_tokens=1600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
    except APIConnectionError as e:
        logger.error(f"I Ching interpretation: connection error: {e}")
        raise InterpretationError("No se pudo conectar con el servicio de interpretación. Inténtalo de nuevo.")
    except APIError as e:
        logger.error(f"I Ching interpretation: API error: {e}")
        raise InterpretationError("El servicio de interpretación no está disponible en este momento.")

    text_blocks = [block.text for block in response.content if getattr(block, "type", None) == "text"]
    result = "\n".join(text_blocks).strip()
    if not result:
        raise InterpretationError("No se pudo generar la interpretación. Inténtalo de nuevo.")
    return result

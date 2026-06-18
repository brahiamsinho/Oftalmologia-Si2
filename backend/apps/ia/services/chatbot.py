"""
Asistente virtual conversacional (CU23) usando Google Gemini.
"""
from __future__ import annotations

import logging
from typing import Any

from apps.ia.services.nlp_translator import (
    _candidate_models,
    _friendly_gemini_api_error,
    _is_retryable_gemini_error,
    normalize_gemini_model_name,
)
from django.conf import settings

logger = logging.getLogger(__name__)

_GEMINI_MODEL_DEFAULT = 'gemini-2.5-flash'

_CHATBOT_SYSTEM_PROMPT = """Eres el asistente virtual de una clínica oftalmológica (Oftalmología Si2).

Tu objetivo principal:
- Ayudar al personal de la clínica en tareas operativas y administrativas diarias.
- Brindar orientación clínica de primer nivel sin reemplazar el criterio médico.

Prioridades del dominio oftalmológico:
- Gestión de agenda (consultas, controles, reprogramaciones y priorización de urgencias).
- Flujo de atención (admisión, consulta, estudios, cirugía y postoperatorio).
- Cobertura y facturación (seguros, convenios, descuentos y copagos).
- Uso del sistema (reportes, búsquedas, registro y seguimiento de pacientes).

Reglas de seguridad clínica:
- Si detectas síntomas de alarma (dolor ocular intenso, pérdida súbita de visión, trauma, etc.), indica atención médica inmediata o derivación a urgencias.
- No emitas diagnósticos definitivos ni prescripciones.
- Cuando falte contexto crítico, solicita datos mínimos antes de sugerir acciones.
- Nunca inventes datos de pacientes, resultados, medicamentos ni citas.

Reglas:
1) Responde siempre en español.
2) Mantén tono profesional, claro y empático.
3) Responde de forma breve, accionable y enfocada en "qué hacer ahora".
4) Usa formato de texto plano (sin markdown complejo).
"""


class GeminiChatbotError(Exception):
    """Error de configuración, llamada a Gemini o salida inválida."""


class GeminiChatbotAssistant:
    """
    Cliente Gemini para conversación multi-turn de CU23.

    Reutiliza ``settings.GEMINI_API_KEY`` y ``settings.GEMINI_MODEL``.
    """

    def __init__(self, system_instruction: str | None = None) -> None:
        self._api_key = (getattr(settings, 'GEMINI_API_KEY', None) or '').strip()
        self._model_name = normalize_gemini_model_name(
            getattr(settings, 'GEMINI_MODEL', None) or _GEMINI_MODEL_DEFAULT,
        )
        self._system_instruction = (system_instruction or _CHATBOT_SYSTEM_PROMPT).strip()
        if not self._api_key:
            raise GeminiChatbotError(
                'GEMINI_API_KEY no está configurada. Defina la variable de entorno o settings.',
            )

    @staticmethod
    def _build_prompt(message: str, history: list[dict[str, Any]]) -> str:
        lines: list[str] = []
        for item in history:
            role = (item.get('role') or '').strip().lower()
            content = (item.get('content') or '').strip()
            if role not in {'user', 'assistant'} or not content:
                continue
            tag = 'Usuario' if role == 'user' else 'Asistente'
            lines.append(f'{tag}: {content}')
        lines.append(f'Usuario: {message.strip()}')
        lines.append('Asistente:')
        return '\n'.join(lines)

    def generate_reply(self, *, message: str, history: list[dict[str, Any]]) -> dict[str, str]:
        text = (message or '').strip()
        if not text:
            raise GeminiChatbotError('El mensaje no puede estar vacío.')

        try:
            import google.generativeai as genai
            from google.api_core import exceptions as google_exceptions
        except ImportError as exc:
            raise GeminiChatbotError('Dependencia google-generativeai no instalada.') from exc

        genai.configure(api_key=self._api_key)
        candidates = _candidate_models(self._model_name)
        prompt = self._build_prompt(text, history)

        last_exc: Exception | None = None
        used_model = self._model_name
        response_text = ''

        for model_name in candidates:
            used_model = model_name
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=self._system_instruction,
            )
            try:
                response = model.generate_content(
                    prompt,
                    generation_config={'temperature': 0.4},
                )
                response_text = (response.text or '').strip()
                break
            except google_exceptions.GoogleAPIError as exc:
                last_exc = exc
                logger.warning('Gemini chatbot API error (%s): %s', model_name, exc, exc_info=False)
                if model_name != candidates[-1] and _is_retryable_gemini_error(exc):
                    continue
                raise GeminiChatbotError(
                    _friendly_gemini_api_error(
                        exc,
                        model_name,
                        tried_models=candidates,
                    ),
                ) from exc
            except Exception as exc:
                logger.exception('Fallo inesperado al llamar a Gemini chatbot (%s)', model_name)
                raise GeminiChatbotError(f'Error al generar respuesta del asistente: {exc}') from exc

        if not response_text:
            if last_exc is not None:
                raise GeminiChatbotError(
                    _friendly_gemini_api_error(
                        last_exc,
                        used_model,
                        tried_models=candidates,
                    ),
                ) from last_exc
            raise GeminiChatbotError('El asistente no devolvió contenido. Reintente.')

        return {'reply': response_text, 'model': used_model}

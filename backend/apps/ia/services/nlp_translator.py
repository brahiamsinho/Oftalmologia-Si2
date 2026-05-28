"""
Traducción NL → JSON QBE vía Google Gemini (CU23).

La salida está pensada para encadenarse con ``QBEEngine`` en ``apps.reportes``:
solo se permiten modelos y campos alineados con el dominio real.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)

# Modelo GA recomendado (1.5-flash fue retirado de la API en 2025 — devuelve 404).
_GEMINI_MODEL_DEFAULT = 'gemini-2.5-flash'

# Nombres legacy del .env o tutoriales viejos → modelo vigente.
_GEMINI_MODEL_ALIASES: dict[str, str] = {
    'gemini-1.5-flash': _GEMINI_MODEL_DEFAULT,
    'gemini-1.5-flash-latest': _GEMINI_MODEL_DEFAULT,
    'gemini-1.5-flash-8b-latest': _GEMINI_MODEL_DEFAULT,
    'gemini-1.5-pro-latest': 'gemini-2.5-pro',
    'gemini-2.0-flash': _GEMINI_MODEL_DEFAULT,
}

# Si el primario falla (404 cuota, etc.), se prueba en orden.
_GEMINI_MODEL_FALLBACKS: tuple[str, ...] = (
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
)

_ALLOWED_MODELS = frozenset({'Paciente', 'Cita'})
_ALLOWED_JSON_KEYS = frozenset({'model', 'fields', 'filters'})

# Prompt alineado al ORM real (EstadoCita en apps.atencionClinica.citas).
_GEMINI_SYSTEM_PROMPT = """Eres un asistente de consultas QBE (Query By Example) para un sistema clínico llamado Oftalmología Si2.

REGLAS ABSOLUTAS (incumplir = respuesta inválida):
1) Tu ÚNICA salida debe ser UN objeto JSON válido en texto plano.
2) NO uses markdown. NO uses bloques ```. NO añadas comentarios, explicaciones ni texto antes ni después del JSON.
3) El JSON debe tener EXACTAMENTE estas claves de nivel superior: "model", "fields", "filters".
   - "model": cadena, uno de: "Paciente", "Cita".
   - "fields": lista de cadenas con nombres de atributos del modelo, o [] para pedir todas las columnas en consulta tabular.
   - "filters": objeto; claves = nombres de campo o lookups Django simples (ej. fecha_hora_inicio__gte). Valores = tipos JSON (string, number, boolean, null, arrays solo para __in).

MODELO Paciente — campos útiles (nombres exactos):
id_paciente, nombres, apellidos, tipo_documento, numero_documento, numero_historia,
fecha_nacimiento, sexo, telefono, email, estado_paciente, fecha_registro, observaciones_generales,
contacto_emergencia_nombre, contacto_emergencia_telefono, direccion

Valores típicos estado_paciente (TextChoices): "ACTIVO", "EN_SEGUIMIENTO", "POSTOPERATORIO", "INACTIVO".

MODELO Cita — campos útiles:
id_cita, fecha_hora_inicio, fecha_hora_fin, estado, motivo, observaciones,
id_paciente_id, id_especialista_id, id_tipo_cita_id, confirmada_en, fecha_creacion

Estados de cita VÁLIDOS en base de datos (usa SOLO estos literales en "estado" o filtros equivalentes):
"PROGRAMADA", "CONFIRMADA", "REPROGRAMADA", "CANCELADA", "ATENDIDA", "NO_ASISTIO".
(No inventes estados como EN_SALA_DE_ESPERA si no están en esta lista.)

Fechas/horas en filtros: preferir ISO 8601 en string UTC, ej. "2024-05-01T00:00:00Z".

EJEMPLO de entrada: "Pacientes que no asistieron este mes"
EJEMPLO de salida (solo el JSON, sin markdown):
{"model":"Cita","fields":["id_cita","fecha_hora_inicio","estado","motivo"],"filters":{"estado":"NO_ASISTIO","fecha_hora_inicio__gte":"2024-05-01T00:00:00Z"}}
"""


class GeminiTranslatorError(Exception):
    """Error de configuración, llamada a Gemini o formato de salida."""


def _friendly_gemini_api_error(
    exc: Exception,
    model_name: str,
    *,
    tried_models: list[str] | None = None,
) -> str:
    """Mensaje corto para UI cuando falla la API de Google."""
    text = str(exc)
    lower = text.lower()
    if '404' in text and 'not found' in lower:
        tried = ', '.join(tried_models) if tried_models else model_name
        return (
            f'El modelo "{model_name}" no existe o fue retirado por Google (404). '
            f'Probados: {tried}. Poné GEMINI_MODEL={_GEMINI_MODEL_DEFAULT} en .env y ejecutá: '
            'docker compose up -d --force-recreate backend'
        )
    if '429' in text or 'quota' in lower or 'rate' in lower:
        return (
            'Cuota de Gemini agotada (plan gratuito o límite por minuto/día). '
            'Esperá ~1 minuto y reintentá. Revisá https://ai.dev/rate-limit '
            f'o activá facturación en Google AI Studio. Último modelo: {model_name}.'
        )
    if '401' in text or '403' in text or 'api key' in lower:
        return 'GEMINI_API_KEY inválida o sin permisos. Generá una clave en https://aistudio.google.com/apikey'
    return f'Error al contactar la API de Gemini: {text[:500]}'


def _resolve_gemini_model_name(raw: str | None, *, warn_obsolete: bool = False) -> str:
    name = (raw or '').strip() or _GEMINI_MODEL_DEFAULT
    mapped = _GEMINI_MODEL_ALIASES.get(name)
    if mapped:
        if warn_obsolete:
            logger.warning('GEMINI_MODEL=%s obsoleto; usando %s', name, mapped)
        return mapped
    if name.endswith('-latest'):
        fallback = name[: -len('-latest')]
        if warn_obsolete:
            logger.warning('GEMINI_MODEL=%s usa sufijo -latest; usando %s', name, fallback)
        return fallback
    return name


def normalize_gemini_model_name(raw: str | None) -> str:
    """Normaliza GEMINI_MODEL: quita alias -latest obsoletos y mapea nombres retirados."""
    return _resolve_gemini_model_name(raw, warn_obsolete=True)


def _candidate_models(primary: str) -> list[str]:
    """Lista única de modelos a intentar (primario + fallbacks normalizados)."""
    seen: set[str] = set()
    ordered: list[str] = []
    for raw in (primary, *_GEMINI_MODEL_FALLBACKS):
        name = _resolve_gemini_model_name(raw, warn_obsolete=False)
        if name not in seen:
            seen.add(name)
            ordered.append(name)
    return ordered


def _is_retryable_gemini_error(exc: Exception) -> bool:
    text = str(exc).lower()
    if '404' in str(exc) or 'not found' in text:
        return True
    if '429' in str(exc) or 'quota' in text or 'rate limit' in text:
        return True
    return False


def _strip_code_fences(text: str) -> str:
    t = text.strip()
    if t.startswith('```'):
        t = re.sub(r'^```(?:json)?\s*', '', t, flags=re.IGNORECASE | re.MULTILINE)
        t = re.sub(r'\s*```\s*$', '', t, flags=re.MULTILINE)
    return t.strip()


def _parse_json_strict(raw: str) -> dict[str, Any]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise GeminiTranslatorError(
            'La respuesta del modelo no es JSON válido. Ajuste la consulta o reintente.',
        ) from exc
    if not isinstance(data, dict):
        raise GeminiTranslatorError('El JSON raíz debe ser un objeto.')
    return data


def _normalize_qbe_payload(data: dict[str, Any]) -> dict[str, Any]:
    extra = set(data.keys()) - _ALLOWED_JSON_KEYS
    if extra:
        raise GeminiTranslatorError(f'Claves JSON no permitidas: {sorted(extra)}.')
    model = data.get('model')
    if not isinstance(model, str) or model not in _ALLOWED_MODELS:
        raise GeminiTranslatorError(
            f'Campo "model" debe ser uno de: {", ".join(sorted(_ALLOWED_MODELS))}.',
        )
    fields = data.get('fields', [])
    if fields is None:
        fields = []
    if not isinstance(fields, list) or not all(isinstance(x, str) for x in fields):
        raise GeminiTranslatorError('"fields" debe ser una lista de cadenas (o vacía).')
    filters = data.get('filters', {})
    if filters is None:
        filters = {}
    if not isinstance(filters, dict):
        raise GeminiTranslatorError('"filters" debe ser un objeto.')
    for k in filters:
        if not isinstance(k, str):
            raise GeminiTranslatorError('Las claves de "filters" deben ser cadenas.')
    return {'model': model, 'fields': fields or None, 'filters': filters}


class GeminiQBETranslator:
    """
    Cliente Gemini que traduce texto natural a un dict compatible con ``QBEEngine``.

    La API key se lee de ``settings.GEMINI_API_KEY`` (definida en ``config/settings.py``
    desde variables de entorno).
    """

    def __init__(self) -> None:
        self._api_key = (getattr(settings, 'GEMINI_API_KEY', None) or '').strip()
        self._model_name = normalize_gemini_model_name(
            getattr(settings, 'GEMINI_MODEL', None) or _GEMINI_MODEL_DEFAULT,
        )
        if not self._api_key:
            raise GeminiTranslatorError(
                'GEMINI_API_KEY no está configurada. Defina la variable de entorno o settings.',
            )

    def translate_to_qbe(self, text_query: str) -> dict[str, Any]:
        """
        Llama a Gemini y devuelve un dict con claves ``model``, ``fields``, ``filters``.

        Raises:
            GeminiTranslatorError: configuración, red, modelo o JSON inválido.
        """
        query = (text_query or '').strip()
        if not query:
            raise GeminiTranslatorError('La consulta en lenguaje natural está vacía.')

        try:
            import google.generativeai as genai
            from google.api_core import exceptions as google_exceptions
        except ImportError as exc:
            raise GeminiTranslatorError(
                'Dependencia google-generativeai no instalada.',
            ) from exc

        genai.configure(api_key=self._api_key)

        candidates = _candidate_models(self._model_name)
        last_exc: Exception | None = None
        response = None
        used_model = self._model_name

        for model_name in candidates:
            used_model = model_name
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=_GEMINI_SYSTEM_PROMPT,
            )
            try:
                try:
                    response = model.generate_content(
                        query,
                        generation_config={
                            'temperature': 0.0,
                            'response_mime_type': 'application/json',
                        },
                    )
                except (TypeError, ValueError):
                    response = model.generate_content(
                        query,
                        generation_config={'temperature': 0.0},
                    )
                break
            except google_exceptions.GoogleAPIError as exc:
                last_exc = exc
                logger.warning('Gemini API error (%s): %s', model_name, exc, exc_info=False)
                if model_name != candidates[-1] and _is_retryable_gemini_error(exc):
                    continue
                raise GeminiTranslatorError(
                    _friendly_gemini_api_error(
                        exc,
                        model_name,
                        tried_models=candidates,
                    ),
                ) from exc
            except Exception as exc:
                logger.exception('Fallo inesperado al llamar a Gemini (%s)', model_name)
                raise GeminiTranslatorError(f'Error al generar la consulta QBE: {exc}') from exc

        if response is None:
            raise GeminiTranslatorError(
                _friendly_gemini_api_error(
                    last_exc or Exception('Sin respuesta de Gemini'),
                    used_model,
                    tried_models=candidates,
                ),
            )

        if used_model != self._model_name:
            logger.info('Gemini respondió con modelo alternativo: %s', used_model)

        text = (response.text or '').strip()
        if not text:
            raise GeminiTranslatorError('Gemini devolvió una respuesta vacía.')

        parsed = _parse_json_strict(_strip_code_fences(text))
        return _normalize_qbe_payload(parsed)

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

_ALLOWED_MODELS = frozenset({'Paciente', 'Cita'})
_ALLOWED_JSON_KEYS = frozenset({'model', 'fields', 'filters'})

# Prompt alineado al ORM real (EstadoCita en apps.atencionClinica.citas).
_GEMINI_SYSTEM_PROMPT = """Eres un asistente de consultas QBE (Query By Example) para un sistema clínico llamado Oftalmología Si2.

REGLAS ABSOLUTAS (incumplir = respuesta inválida):
1) Tu ÚNICA salida debe ser UN objeto JSON válido en texto plano.
2) NO uses markdown. NO uses bloques ```. NO añadas comentarios, explicaciones ni texto antes ni después del JSON.
3) El JSON debe tener EXACTAMENTE estas claves de nivel superior: "model", "fields", "filters".
   - "model": cadena, uno de: "Paciente", "Cita".
   - "fields": lista de cadenas con nombres de atributos del modelo. Debe ser una lista NO vacía con columnas legibles para el usuario final.
   - "filters": objeto; claves = nombres de campo o lookups Django simples (ej. fecha_hora_inicio__gte). Valores = tipos JSON (string, number, boolean, null, arrays solo para __in).

REGLA DE COLUMNAS (obligatoria):
- Si el usuario NO especifica qué columnas o campos quiere ver, NUNCA devuelvas campos técnicos como "id", "usuario_id", "tenant_id" ni claves foráneas crudas (nombres que terminen en "_id" salvo que el usuario las pida explícitamente).
- Para el modelo "Paciente", si no pidió columnas concretas, usa por defecto en "fields": nombres, apellidos, tipo_documento, numero_documento (en ese orden; puedes añadir otros NO técnicos si aportan contexto, ej. estado_paciente, telefono).
- Para el modelo "Cita", si no pidió columnas concretas, usa por defecto en "fields": fecha_hora_inicio, estado, motivo (en ese orden; puedes añadir otros NO técnicos si aportan contexto, ej. observaciones).
- NUNCA uses "fields": [] ni omitas campos sustituyendo por "todas las columnas": una lista vacía en el backend equivale a exponer TODA la tabla con IDs y FKs y arruina la UX.

MODELO Paciente — referencia de campos (nombres exactos; evita IDs/FK en "fields" salvo petición explícita):
id_paciente, nombres, apellidos, tipo_documento, numero_documento, numero_historia,
fecha_nacimiento, sexo, telefono, email, estado_paciente, fecha_registro, observaciones_generales,
contacto_emergencia_nombre, contacto_emergencia_telefono, direccion

Valores típicos estado_paciente (TextChoices): "ACTIVO", "EN_SEGUIMIENTO", "POSTOPERATORIO", "INACTIVO".

MODELO Cita — referencia de campos para filtros o columnas NO técnicas:
fecha_hora_inicio, fecha_hora_fin, estado, motivo, observaciones, confirmada_en, fecha_creacion
(Las FK internas sirven para "filters" si hace falta; no las pongas en "fields" salvo que el usuario las pida.)

Estados de cita VÁLIDOS en base de datos (usa SOLO estos literales en "estado" o filtros equivalentes):
"PROGRAMADA", "CONFIRMADA", "REPROGRAMADA", "CANCELADA", "ATENDIDA", "NO_ASISTIO".
(No inventes estados como EN_SALA_DE_ESPERA si no están en esta lista.)

Fechas/horas en filtros: preferir ISO 8601 en string UTC, ej. "2024-05-01T00:00:00Z".

EJEMPLO de entrada: "Pacientes que no asistieron este mes"
EJEMPLO de salida (solo el JSON, sin markdown):
{"model":"Cita","fields":["fecha_hora_inicio","estado","motivo"],"filters":{"estado":"NO_ASISTIO","fecha_hora_inicio__gte":"2024-05-01T00:00:00Z"}}
"""


class GeminiTranslatorError(Exception):
    """Error de configuración, llamada a Gemini o formato de salida."""


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
        self._model_name = (getattr(settings, 'GEMINI_MODEL', None) or 'gemini-1.5-flash').strip()
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

        model = genai.GenerativeModel(
            model_name=self._model_name,
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
        except google_exceptions.GoogleAPIError as exc:
            logger.warning('Gemini API error: %s', exc, exc_info=False)
            raise GeminiTranslatorError(f'Error al contactar la API de Gemini: {exc}') from exc
        except Exception as exc:
            logger.exception('Fallo inesperado al llamar a Gemini')
            raise GeminiTranslatorError(f'Error al generar la consulta QBE: {exc}') from exc

        text = (response.text or '').strip()
        if not text:
            raise GeminiTranslatorError('Gemini devolvió una respuesta vacía.')

        parsed = _parse_json_strict(_strip_code_fences(text))
        return _normalize_qbe_payload(parsed)

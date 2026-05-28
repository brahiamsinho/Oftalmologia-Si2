"""
Detecta formatos de exportación pedidos en lenguaje natural (sin depender del LLM).
"""
from __future__ import annotations

import re

_EXPORT_EXCEL = re.compile(
    r'\b(?:excel|xlsx|xls|spreadsheet|hoja(?:s)?\s+de\s+c[aá]lculo)\b',
    re.IGNORECASE,
)
_EXPORT_PDF = re.compile(r'\b(?:pdf)\b', re.IGNORECASE)
_EXPORT_CSV = re.compile(r'\b(?:csv)\b', re.IGNORECASE)

_SUPPORTED = ('excel', 'pdf', 'csv')


def parse_export_formats_from_query(query: str) -> list[str]:
    """
    Devuelve formatos únicos en orden estable: excel, pdf, csv.

    Ej.: "listar pacientes activos en excel y pdf" → ["excel", "pdf"]
    """
    if not (query or '').strip():
        return []

    found: list[str] = []
    if _EXPORT_EXCEL.search(query):
        found.append('excel')
    if _EXPORT_PDF.search(query):
        found.append('pdf')
    if _EXPORT_CSV.search(query):
        found.append('csv')

    return [f for f in _SUPPORTED if f in found]

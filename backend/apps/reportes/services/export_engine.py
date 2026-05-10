"""
Exportación de resultados QBE a Excel (openpyxl), solo en memoria.

Entrada: salida de ``QBEEngine.execute`` con ``meta`` y ``data``.
Salida: ``BytesIO`` con un libro .xlsx (sin escribir disco).
"""
from __future__ import annotations

from io import BytesIO
from typing import Any

from openpyxl import Workbook
from openpyxl.utils import get_column_letter


def qbe_result_to_excel_bytes(result: dict[str, Any]) -> BytesIO:
    """
    Construye un libro Excel en memoria a partir de ``meta`` y ``data``.

    - Fila 1: encabezados según ``meta['columns']`` (o claves del primer registro).
    - Filas siguientes: valores alineados por columna.

    Args:
        result: dict con al menos ``meta`` (dict) y ``data`` (lista de dicts).

    Returns:
        BytesIO posicionado al inicio, listo para leer en una HttpResponse.
    """
    meta = result.get('meta') or {}
    rows: list[dict[str, Any]] = list(result.get('data') or [])

    columns: list[str] = list(meta.get('columns') or [])
    if not columns and rows:
        columns = list(rows[0].keys())

    wb = Workbook()
    ws = wb.active
    ws.title = 'Reporte'

    for col_idx, header in enumerate(columns, start=1):
        ws.cell(row=1, column=col_idx, value=str(header))

    for row_idx, row_dict in enumerate(rows, start=2):
        for col_idx, key in enumerate(columns, start=1):
            val = row_dict.get(key)
            if val is not None and not isinstance(val, (str, int, float, bool)):
                val = str(val)
            ws.cell(row=row_idx, column=col_idx, value=val)

    # Ancho mínimo razonable por columna (opcional, mejora lectura en Excel)
    for col_idx in range(1, len(columns) + 1):
        letter = get_column_letter(col_idx)
        ws.column_dimensions[letter].width = min(max(12, len(columns[col_idx - 1]) + 2), 40)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer

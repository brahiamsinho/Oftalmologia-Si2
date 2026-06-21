from __future__ import annotations

import io
from xml.sax.saxutils import escape

from django.utils import timezone

from .models import DocumentoClinicoAutorizado


def _safe_pdf_text(value: str | None) -> str:
    return escape(value or '')


def _download_filename(documento: DocumentoClinicoAutorizado) -> str:
    from django.utils.text import slugify

    base = documento.nombre_archivo_descarga.strip() if documento.nombre_archivo_descarga else ''
    if not base:
        base = f'{documento.tipo_documento.lower()}-{documento.id_documento_clinico}'
    slug = slugify(base) or f'documento-clinico-{documento.id_documento_clinico}'
    if not slug.endswith('.pdf'):
        slug = f'{slug}.pdf'
    return slug


def generar_documento_clinico_pdf(documento: DocumentoClinicoAutorizado) -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
        from reportlab.lib import colors
    except ImportError as exc:  # pragma: no cover - fallback de infraestructura
        raise RuntimeError(
            'reportlab no está instalado. Agregue reportlab a requirements/base.txt.',
        ) from exc

    documento = DocumentoClinicoAutorizado.objects.select_related(
        'id_historia_clinica',
        'id_paciente',
        'autorizado_por',
    ).get(pk=documento.pk)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = styles['Title']
    subtitle_style = styles['Heading3']
    body_style = ParagraphStyle(
        'DocumentoClinicoBody',
        parent=styles['BodyText'],
        leading=13,
        spaceAfter=6,
    )

    paciente = documento.id_paciente
    historia = documento.id_historia_clinica
    autorizado_por = documento.autorizado_por

    metadata = [
        ['Paciente', f'{paciente.get_full_name()} — {paciente.numero_historia}'],
        ['Documento', documento.get_tipo_documento_display()],
        ['Estado', documento.get_estado_display()],
        ['Historia clínica', f'HC-{historia.id_historia_clinica}'],
        ['Autorizado por', autorizado_por.get_full_name() if autorizado_por else 'Pendiente'],
        ['Autorizado en', documento.autorizado_en.strftime('%Y-%m-%d %H:%M') if documento.autorizado_en else 'Pendiente'],
        ['Fecha de emisión', documento.fecha_emision.strftime('%Y-%m-%d %H:%M')],
        ['Archivo', _download_filename(documento)],
    ]

    contenido_html = _safe_pdf_text(documento.contenido).replace('\n', '<br/>')
    metadata_table = Table(
        [
            [
                Paragraph(f'<b>{_safe_pdf_text(label)}</b>', body_style),
                Paragraph(_safe_pdf_text(value).replace('\n', '<br/>'), body_style),
            ]
            for label, value in metadata
        ],
        colWidths=[42 * mm, 120 * mm],
    )
    story = [
        Paragraph('Documento clínico autorizado', title_style),
        Paragraph(_safe_pdf_text(documento.titulo), subtitle_style),
        Spacer(1, 6),
        metadata_table,
        Spacer(1, 10),
        Paragraph('<b>Contenido</b>', subtitle_style),
        Paragraph(contenido_html or 'Sin contenido.', body_style),
        Spacer(1, 8),
        Paragraph(
            f'Generado el {timezone.localtime():%Y-%m-%d %H:%M}',
            styles['Italic'],
        ),
    ]

    metadata_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e2e8f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEADING', (0, 0), (-1, -1), 11),
        ])
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def documento_clinico_download_filename(documento: DocumentoClinicoAutorizado) -> str:
    return _download_filename(documento)

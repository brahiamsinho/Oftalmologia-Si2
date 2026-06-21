from __future__ import annotations

import io
import textwrap

from django.core.exceptions import ObjectDoesNotExist
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone

from .models import DocumentoClinicoAutorizado, EstadoDocumentoClinico, TipoDocumentoClinico


def generar_documento_pdf_bytes(documento) -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        raise RuntimeError('reportlab no está instalado. Agregue reportlab a requirements/base.txt.') from exc

    historia = documento.id_historia_clinica
    paciente = historia.id_paciente
    creador = documento.creado_por

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    x = 20 * mm
    y = height - 20 * mm

    def line(text: str, size: int = 10, bold: bool = False, indent_mm: int = 0):
        nonlocal y
        pdf.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
        usable_chars = 96 - indent_mm * 2
        for chunk in textwrap.wrap(text, width=max(40, usable_chars)) or ['']:
            pdf.drawString(x + indent_mm * mm, y, chunk[:120])
            y -= 5.5 * mm

    line('DOCUMENTO CLÍNICO AUTORIZADO', 14, bold=True)
    line(f'Tipo: {documento.get_tipo_documento_display()}')
    line(f'Título: {documento.titulo}', bold=True)
    y -= 2 * mm
    line(f'Paciente: {paciente.get_full_name()}')
    line(f'Historia clínica: HC-{paciente.numero_historia} (ID {historia.id_historia_clinica})')
    line(f'Estado: {documento.get_estado_display()}')
    line(f'Emitido: {timezone.localtime(documento.fecha_emision):%Y-%m-%d %H:%M}')
    if documento.fecha_vencimiento:
        line(f'Vence: {documento.fecha_vencimiento:%Y-%m-%d}')
    if creador:
        line(f'Emitido por: {creador.get_full_name() or creador.username}')
    if documento.origen_modulo:
        line(f'Origen: {documento.origen_modulo}', bold=True)
    if documento.origen_registro_id:
        line(f'Registro origen: {documento.origen_registro_id}')

    y -= 2 * mm
    line('INDICACIONES', 11, bold=True)
    line(documento.contenido or 'Sin contenido textual asociado.', indent_mm=0)
    y -= 4 * mm
    line(f'Generado: {timezone.localtime():%Y-%m-%d %H:%M}', 8)

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()


def _sync_documento_pdf(documento: DocumentoClinicoAutorizado) -> DocumentoClinicoAutorizado:
    pdf_bytes = generar_documento_pdf_bytes(documento)
    if documento.archivo and documento.archivo.name and default_storage.exists(documento.archivo.name):
        default_storage.delete(documento.archivo.name)

    nombre = (
        f'documentos_clinicos/{documento.fecha_emision:%Y/%m/%d}/'
        f'documento-{documento.id_documento_clinico}.pdf'
    )
    documento.archivo.save(nombre, ContentFile(pdf_bytes), save=True)
    return documento


def emitir_documento_clinico(
    *,
    historia_clinica,
    tipo_documento: str,
    titulo: str,
    contenido: str,
    creado_por=None,
    origen_modulo: str,
    origen_registro_id: int,
    observaciones: str | None = None,
) -> DocumentoClinicoAutorizado:
    documento = DocumentoClinicoAutorizado.objects.filter(
        origen_modulo=origen_modulo,
        origen_registro_id=origen_registro_id,
    ).first()

    if documento is None:
        documento = DocumentoClinicoAutorizado(
            id_historia_clinica=historia_clinica,
            tipo_documento=tipo_documento,
            titulo=titulo,
            contenido=contenido,
            estado=EstadoDocumentoClinico.ACTIVO,
            creado_por=creado_por,
            origen_modulo=origen_modulo,
            origen_registro_id=origen_registro_id,
            observaciones=observaciones,
        )
        documento.save()
    else:
        documento.tipo_documento = tipo_documento
        documento.id_historia_clinica = historia_clinica
        documento.titulo = titulo
        documento.contenido = contenido
        documento.estado = EstadoDocumentoClinico.ACTIVO
        documento.creado_por = creado_por
        documento.observaciones = observaciones
        documento.save(update_fields=['id_historia_clinica', 'tipo_documento', 'titulo', 'contenido', 'estado', 'creado_por', 'observaciones'])

    return _sync_documento_pdf(documento)


def _clean_text(value) -> str:
    if value is None:
        return 'No registrado'
    text = str(value).strip()
    return text or 'No registrado'


def emitir_documento_desde_consulta(consulta, creado_por=None) -> DocumentoClinicoAutorizado | None:
    try:
        historia = consulta.paciente.historia_clinica
    except ObjectDoesNotExist:
        historia = None
    if historia is None:
        return None

    contenido = '\n'.join([
        f'Motivo: {_clean_text(consulta.motivo)}',
        f'Síntomas: {_clean_text(consulta.sintomas)}',
        f'Notas clínicas: {_clean_text(consulta.notas_clinicas)}',
        f'PIO OD: {_clean_text(consulta.presion_intraocular_od)}',
        f'PIO OI: {_clean_text(consulta.presion_intraocular_oi)}',
    ])

    return emitir_documento_clinico(
        historia_clinica=historia,
        tipo_documento=TipoDocumentoClinico.INDICACION,
        titulo=f'Indicaciones de consulta #{consulta.pk}',
        contenido=contenido,
        creado_por=creado_por,
        origen_modulo='consultas',
        origen_registro_id=consulta.pk,
        observaciones='Generado desde ConsultaViewSet',
    )


def emitir_documento_desde_preoperatorio(preoperatorio, creado_por=None) -> DocumentoClinicoAutorizado | None:
    historia = preoperatorio.id_historia_clinica
    contenido = '\n'.join([
        f'Estado: {preoperatorio.get_estado_preoperatorio_display()}',
        f'Checklist completado: {"Sí" if preoperatorio.checklist_completado else "No"}',
        f'Detalle checklist: {_clean_text(preoperatorio.checklist_detalle)}',
        f'Exámenes requeridos: {_clean_text(preoperatorio.examenes_requeridos)}',
        f'Exámenes completados: {_clean_text(preoperatorio.examenes_completados)}',
        f'Apto anestesia: {"Sí" if preoperatorio.apto_anestesia else "No"}',
        f'Cirugía programada: {preoperatorio.fecha_programada_cirugia or "No registrada"}',
        f'Observaciones: {_clean_text(preoperatorio.observaciones)}',
    ])

    return emitir_documento_clinico(
        historia_clinica=historia,
        tipo_documento=TipoDocumentoClinico.INDICACION,
        titulo=f'Indicaciones preoperatorias #{preoperatorio.id_preoperatorio}',
        contenido=contenido,
        creado_por=creado_por,
        origen_modulo='preoperatorio',
        origen_registro_id=preoperatorio.id_preoperatorio,
        observaciones='Generado desde PreoperatorioViewSet',
    )


def emitir_documento_desde_cirugia(cirugia, creado_por=None) -> DocumentoClinicoAutorizado | None:
    historia = cirugia.id_historia_clinica
    contenido = '\n'.join([
        f'Estado: {cirugia.get_estado_cirugia_display()}',
        f'Fecha programada: {cirugia.fecha_programada}',
        f'Inicio real: {cirugia.fecha_real_inicio or "No registrada"}',
        f'Fin real: {cirugia.fecha_real_fin or "No registrada"}',
        f'Procedimiento: {_clean_text(cirugia.procedimiento)}',
        f'Resultado: {_clean_text(cirugia.resultado)}',
        f'Complicaciones: {_clean_text(cirugia.complicaciones)}',
        f'Observaciones: {_clean_text(cirugia.observaciones)}',
        f'Motivo reprogramación: {_clean_text(cirugia.motivo_reprogramacion)}',
    ])

    return emitir_documento_clinico(
        historia_clinica=historia,
        tipo_documento=TipoDocumentoClinico.INDICACION,
        titulo=f'Resumen quirúrgico #{cirugia.id_cirugia}',
        contenido=contenido,
        creado_por=creado_por,
        origen_modulo='cirugias',
        origen_registro_id=cirugia.id_cirugia,
        observaciones='Generado desde CirugiaViewSet',
    )


def emitir_documento_desde_postoperatorio(postoperatorio, creado_por=None) -> DocumentoClinicoAutorizado | None:
    historia = postoperatorio.id_historia_clinica
    contenido = '\n'.join([
        f'Estado: {postoperatorio.get_estado_postoperatorio_display()}',
        f'Fecha control: {postoperatorio.fecha_control}',
        f'Próximo control: {postoperatorio.proximo_control or "No registrado"}',
        f'Alertas: {_clean_text(postoperatorio.alertas)}',
        f'Observaciones: {_clean_text(postoperatorio.observaciones)}',
    ])

    return emitir_documento_clinico(
        historia_clinica=historia,
        tipo_documento=TipoDocumentoClinico.INDICACION,
        titulo=f'Indicaciones postoperatorias #{postoperatorio.id_postoperatorio}',
        contenido=contenido,
        creado_por=creado_por,
        origen_modulo='postoperatorio',
        origen_registro_id=postoperatorio.id_postoperatorio,
        observaciones='Generado desde PostoperatorioViewSet',
    )

"""
apps/crm/reportes/models.py
CU17 — Generar y exportar reportes

Solo almacena METADATOS de cada reporte generado (auditoría).
Los datos reales se generan en tiempo real por el ViewSet.
"""
from django.conf import settings
from django.db import models


class TipoReporte(models.TextChoices):
    RESUMEN_PACIENTES    = 'RESUMEN_PACIENTES',    'Resumen de pacientes'
    CITAS                = 'CITAS',                'Citas y agenda'
    CONSULTAS            = 'CONSULTAS',            'Consultas clínicas'
    MEDICIONES_VISUALES  = 'MEDICIONES_VISUALES',  'Mediciones visuales'
    CIRUGIAS             = 'CIRUGIAS',             'Cirugías'
    POSTOPERATORIO       = 'POSTOPERATORIO',       'Seguimiento postoperatorio'
    CRM_COMUNICACIONES   = 'CRM_COMUNICACIONES',   'Comunicaciones CRM'


class FormatoExportacion(models.TextChoices):
    JSON = 'JSON', 'JSON (API)'
    CSV  = 'CSV',  'CSV'


class EstadoReporte(models.TextChoices):
    GENERADO = 'GENERADO', 'Generado correctamente'
    ERROR    = 'ERROR',    'Error al generar'


class ReporteGenerado(models.Model):
    """
    Registro de auditoría de cada reporte solicitado.
    Guarda quién lo generó, qué tipo, cuándo y cuántos registros incluyó.
    Los datos en sí no se almacenan aquí; se regeneran en /reportes/{id}/regenerar/.
    """
    id_reporte = models.BigAutoField(primary_key=True)

    tipo_reporte = models.CharField(
        max_length=25,
        choices=TipoReporte.choices,
    )
    formato = models.CharField(
        max_length=4,
        choices=FormatoExportacion.choices,
        default=FormatoExportacion.JSON,
    )

    fecha_desde = models.DateField(blank=True, null=True)
    fecha_hasta = models.DateField(blank=True, null=True)

    # JSON con filtros adicionales que se usaron al generar (para audit trail)
    filtros_extra = models.JSONField(blank=True, null=True)

    estado = models.CharField(
        max_length=8,
        choices=EstadoReporte.choices,
        default=EstadoReporte.GENERADO,
    )
    total_registros = models.IntegerField(default=0)
    mensaje_error = models.TextField(blank=True, null=True)

    generado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='generado_por',
        related_name='reportes_generados',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'crm_reportes_generados'
        verbose_name = 'Reporte generado'
        verbose_name_plural = 'Reportes generados'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f'{self.get_tipo_reporte_display()} '
            f'({self.get_formato_display()}) — '
            f'{self.created_at.strftime("%Y-%m-%d %H:%M") if self.created_at else "?"}'
        )

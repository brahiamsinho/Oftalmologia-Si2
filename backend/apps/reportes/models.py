"""
Modelos para CU21 (reportes personalizados) y CU22 (reportes predefinidos).

Las plantillas almacenan un `qbe_payload` estructurado; la ejecución segura
ocurre solo vía `services.qbe_engine` (ORM), nunca SQL crudo desde cliente o IA.
"""
from django.conf import settings
from django.db import models


class ReportTemplate(models.Model):
    """
    Plantilla de reporte basada en QBE (Query By Example).

    - CU21: plantillas de usuario (`is_system_report=False`).
    - CU22: reportes predefinidos del sistema (`is_system_report=True`).
    """

    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, default='')
    qbe_payload = models.JSONField(
        default=dict,
        help_text='Definición QBE (modelo lógico, filtros, agregaciones). '
        'Interpretado únicamente por el motor seguro en services.qbe_engine.',
    )
    is_system_report = models.BooleanField(
        default=False,
        db_index=True,
        help_text='True = plantilla predefinida (CU22); False = personalizada (CU21).',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='report_templates_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reportes_plantilla'
        verbose_name = 'Plantilla de reporte'
        verbose_name_plural = 'Plantillas de reporte'
        ordering = ['-created_at', 'nombre']

    def __str__(self) -> str:
        return self.nombre

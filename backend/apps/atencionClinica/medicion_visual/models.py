from django.db import models
from django.utils import timezone

from apps.pacientes.pacientes.models import Paciente


class MedicionVisual(models.Model):
    """Registro de agudeza visual (y adjuntos opcionales), desacoplado de otros tipos de estudio."""

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='mediciones_visuales',
    )
    consulta = models.ForeignKey(
        'consultas.Consulta',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mediciones_visuales',
    )
    ojo_derecho = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Agudeza visual OD',
    )
    ojo_izquierdo = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Agudeza visual OI',
    )
    observaciones = models.TextField(blank=True, null=True)
    archivo_resultado = models.FileField(
        upload_to='medicion_visual/resultados/',
        blank=True,
        null=True,
        verbose_name='Archivo / resultado',
    )
    fecha = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Medición visual'
        verbose_name_plural = 'Mediciones visuales'

    def __str__(self):
        return f'Agudeza visual — {self.paciente} ({self.fecha.strftime("%Y-%m-%d")})'

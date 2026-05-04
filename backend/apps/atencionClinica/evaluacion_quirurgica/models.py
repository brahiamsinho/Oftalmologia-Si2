from django.conf import settings
from django.db import models
from django.utils import timezone


class EstadoPrequirurgico(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    APTO = 'APTO', 'Apto'
    APTO_CON_OBSERVACIONES = 'APTO_CON_OBSERVACIONES', 'Apto con observaciones'
    NO_APTO = 'NO_APTO', 'No apto'


class EvaluacionQuirurgica(models.Model):
    id_evaluacion_quirurgica = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='evaluaciones_quirurgicas',
    )
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica',
        on_delete=models.CASCADE,
        db_column='id_historia_clinica',
        related_name='evaluaciones_quirurgicas',
    )
    id_consulta = models.ForeignKey(
        'consultas.Consulta',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_consulta',
        related_name='evaluaciones_quirurgicas',
    )
    evaluado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='evaluado_por',
        related_name='evaluaciones_quirurgicas_realizadas',
    )
    fecha_evaluacion = models.DateTimeField(default=timezone.now)
    estado_prequirurgico = models.CharField(
        max_length=32,
        choices=EstadoPrequirurgico.choices,
        default=EstadoPrequirurgico.PENDIENTE,
    )
    riesgo_quirurgico = models.CharField(max_length=100, blank=True, null=True)
    requiere_estudios_complementarios = models.BooleanField(default=False)
    estudios_solicitados = models.TextField(blank=True, null=True)
    hallazgos = models.TextField(blank=True, null=True)
    plan_quirurgico = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evaluaciones_quirurgicas'
        verbose_name = 'Evaluacion quirurgica'
        verbose_name_plural = 'Evaluaciones quirurgicas'
        ordering = ['-fecha_evaluacion', '-created_at']

    def __str__(self):
        return (
            f'Evaluacion #{self.id_evaluacion_quirurgica} '
            f'Paciente {self.id_paciente_id} ({self.estado_prequirurgico})'
        )


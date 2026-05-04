from django.conf import settings
from django.db import models
from django.utils import timezone


class EstadoPreoperatorio(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    EN_PROCESO = 'EN_PROCESO', 'En proceso'
    APROBADO = 'APROBADO', 'Aprobado'
    OBSERVADO = 'OBSERVADO', 'Observado'
    RECHAZADO = 'RECHAZADO', 'Rechazado'


class Preoperatorio(models.Model):
    id_preoperatorio = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='preoperatorios',
    )
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica',
        on_delete=models.CASCADE,
        db_column='id_historia_clinica',
        related_name='preoperatorios',
    )
    id_evaluacion_quirurgica = models.ForeignKey(
        'evaluacion_quirurgica.EvaluacionQuirurgica',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_evaluacion_quirurgica',
        related_name='preoperatorios',
    )
    id_cita = models.ForeignKey(
        'citas.Cita',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_cita',
        related_name='preoperatorios',
    )
    estado_preoperatorio = models.CharField(
        max_length=20,
        choices=EstadoPreoperatorio.choices,
        default=EstadoPreoperatorio.PENDIENTE,
    )
    checklist_completado = models.BooleanField(default=False)
    checklist_detalle = models.TextField(blank=True, null=True)
    examenes_requeridos = models.TextField(blank=True, null=True)
    examenes_completados = models.TextField(blank=True, null=True)
    apto_anestesia = models.BooleanField(default=False)
    fecha_programada_cirugia = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    validado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='validado_por',
        related_name='preoperatorios_validados',
    )
    fecha_validacion = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'preoperatorios'
        verbose_name = 'Preoperatorio'
        verbose_name_plural = 'Preoperatorios'
        ordering = ['-created_at']

    def marcar_validado(self, usuario):
        self.validado_por = usuario
        self.fecha_validacion = timezone.now()

    def __str__(self):
        return f'Preoperatorio #{self.id_preoperatorio} - Paciente {self.id_paciente_id}'


from django.conf import settings
from django.db import models
from django.utils import timezone


class EstadoCirugia(models.TextChoices):
    PROGRAMADA = 'PROGRAMADA', 'Programada'
    REPROGRAMADA = 'REPROGRAMADA', 'Reprogramada'
    EN_CURSO = 'EN_CURSO', 'En curso'
    FINALIZADA = 'FINALIZADA', 'Finalizada'
    CANCELADA = 'CANCELADA', 'Cancelada'


class Cirugia(models.Model):
    id_cirugia = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='cirugias',
    )
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica',
        on_delete=models.CASCADE,
        db_column='id_historia_clinica',
        related_name='cirugias',
    )
    id_preoperatorio = models.ForeignKey(
        'preoperatorio.Preoperatorio',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_preoperatorio',
        related_name='cirugias',
    )
    id_cita = models.ForeignKey(
        'citas.Cita',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_cita',
        related_name='cirugias',
    )
    cirujano = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='cirujano',
        related_name='cirugias_realizadas',
    )
    estado_cirugia = models.CharField(
        max_length=20,
        choices=EstadoCirugia.choices,
        default=EstadoCirugia.PROGRAMADA,
    )
    fecha_programada = models.DateTimeField()
    fecha_real_inicio = models.DateTimeField(null=True, blank=True)
    fecha_real_fin = models.DateTimeField(null=True, blank=True)
    procedimiento = models.TextField()
    resultado = models.TextField(blank=True, null=True)
    complicaciones = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    motivo_reprogramacion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cirugias'
        verbose_name = 'Cirugia'
        verbose_name_plural = 'Cirugias'
        ordering = ['-fecha_programada', '-created_at']

    def marcar_reprogramada(self, motivo):
        self.estado_cirugia = EstadoCirugia.REPROGRAMADA
        self.motivo_reprogramacion = motivo
        self.save(update_fields=['estado_cirugia', 'motivo_reprogramacion', 'updated_at'])

    def __str__(self):
        return f'Cirugia #{self.id_cirugia} - Paciente {self.id_paciente_id}'


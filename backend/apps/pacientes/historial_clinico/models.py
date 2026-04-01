from datetime import date
from django.db import models

class EstadoHistoriaClinica(models.TextChoices):
    ACTIVA = 'ACTIVA', 'Activa'
    CERRADA = 'CERRADA', 'Cerrada'
    ARCHIVADA = 'ARCHIVADA', 'Archivada'

class HistoriaClinica(models.Model):
    id_historia_clinica = models.BigAutoField(primary_key=True)
    id_paciente = models.OneToOneField(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='historia_clinica',
    )
    fecha_apertura = models.DateField(default=date.today)
    motivo_apertura = models.TextField(blank=True, null=True)
    estado = models.CharField(
        max_length=20, choices=EstadoHistoriaClinica.choices,
        default=EstadoHistoriaClinica.ACTIVA,
    )
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'historias_clinicas'
        verbose_name = 'Historia Clínica'
        verbose_name_plural = 'Historias Clínicas'

    def __str__(self):
        return f'HC-{self.id_paciente_id} ({self.estado})'

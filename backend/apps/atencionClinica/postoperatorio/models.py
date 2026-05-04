from django.conf import settings
from django.db import models


class EstadoPostoperatorio(models.TextChoices):
    ESTABLE = 'ESTABLE', 'Estable'
    EN_OBSERVACION = 'EN_OBSERVACION', 'En observacion'
    COMPLICADO = 'COMPLICADO', 'Complicado'
    CERRADO = 'CERRADO', 'Cerrado'


class Postoperatorio(models.Model):
    id_postoperatorio = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='postoperatorios',
    )
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica',
        on_delete=models.CASCADE,
        db_column='id_historia_clinica',
        related_name='postoperatorios',
    )
    id_cirugia = models.ForeignKey(
        'cirugias.Cirugia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_cirugia',
        related_name='postoperatorios',
    )
    profesional_atiende = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='profesional_atiende',
        related_name='postoperatorios_atendidos',
    )
    estado_postoperatorio = models.CharField(
        max_length=20,
        choices=EstadoPostoperatorio.choices,
        default=EstadoPostoperatorio.EN_OBSERVACION,
    )
    fecha_control = models.DateTimeField()
    proximo_control = models.DateTimeField(null=True, blank=True)
    alertas = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'postoperatorios'
        verbose_name = 'Postoperatorio'
        verbose_name_plural = 'Postoperatorios'
        ordering = ['-fecha_control', '-created_at']

    def __str__(self):
        return f'Postoperatorio #{self.id_postoperatorio} - Paciente {self.id_paciente_id}'

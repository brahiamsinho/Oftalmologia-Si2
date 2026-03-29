from datetime import date
from django.db import models

class DiagnosticoClinico(models.Model):
    id_diagnostico = models.BigAutoField(primary_key=True)
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica', on_delete=models.CASCADE,
        db_column='id_historia_clinica', related_name='diagnosticos',
    )
    fecha_diagnostico = models.DateField(default=date.today)
    descripcion = models.TextField()
    cie10 = models.CharField(max_length=20, blank=True, null=True)
    id_especialista = models.ForeignKey(
        'especialistas.Especialista', on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_especialista', related_name='diagnosticos',
    )
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'diagnosticos_clinicos'
        verbose_name = 'Diagnóstico Clínico'
        verbose_name_plural = 'Diagnósticos Clínicos'
        ordering = ['-fecha_diagnostico']

    def __str__(self):
        return f'Diagnóstico {self.id_diagnostico} — HC {self.id_historia_clinica_id}'

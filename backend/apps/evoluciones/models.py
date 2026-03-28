from django.db import models
from django.utils import timezone

class EvolucionClinica(models.Model):
    id_evolucion = models.BigAutoField(primary_key=True)
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica', on_delete=models.CASCADE,
        db_column='id_historia_clinica', related_name='evoluciones',
    )
    fecha_evolucion = models.DateTimeField(default=timezone.now)
    nota_evolucion = models.TextField()
    id_especialista = models.ForeignKey(
        'especialistas.Especialista', on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_especialista', related_name='evoluciones',
    )

    class Meta:
        db_table = 'evoluciones_clinicas'
        verbose_name = 'Evolución Clínica'
        verbose_name_plural = 'Evoluciones Clínicas'
        ordering = ['-fecha_evolucion']

    def __str__(self):
        return f'Evolución {self.id_evolucion} — {self.fecha_evolucion:%Y-%m-%d}'

from django.db import models
from django.utils import timezone

class Receta(models.Model):
    id_receta = models.BigAutoField(primary_key=True)
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica', on_delete=models.CASCADE,
        db_column='id_historia_clinica', related_name='recetas',
    )
    id_especialista = models.ForeignKey(
        'especialistas.Especialista', on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_especialista', related_name='recetas',
    )
    fecha_receta = models.DateTimeField(default=timezone.now)
    indicaciones_generales = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'recetas'
        verbose_name = 'Receta'
        verbose_name_plural = 'Recetas'
        ordering = ['-fecha_receta']

    def __str__(self):
        return f'Receta {self.id_receta} — {self.fecha_receta:%Y-%m-%d}'

class RecetaDetalle(models.Model):
    id_receta_detalle = models.BigAutoField(primary_key=True)
    id_receta = models.ForeignKey(
        Receta, on_delete=models.CASCADE,
        db_column='id_receta', related_name='detalles',
    )
    medicamento = models.CharField(max_length=150)
    dosis = models.CharField(max_length=100, blank=True, null=True)
    frecuencia = models.CharField(max_length=100, blank=True, null=True)
    duracion = models.CharField(max_length=100, blank=True, null=True)
    via_administracion = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'receta_detalles'
        verbose_name = 'Detalle de Receta'
        verbose_name_plural = 'Detalles de Receta'

    def __str__(self):
        return f'{self.medicamento} ({self.dosis})'

from django.db import models

class EstadoTratamiento(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    SUSPENDIDO = 'SUSPENDIDO', 'Suspendido'
    FINALIZADO = 'FINALIZADO', 'Finalizado'

class TratamientoClinico(models.Model):
    id_tratamiento = models.BigAutoField(primary_key=True)
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica', on_delete=models.CASCADE,
        db_column='id_historia_clinica', related_name='tratamientos',
    )
    id_diagnostico = models.ForeignKey(
        'diagnosticos.DiagnosticoClinico', on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_diagnostico', related_name='tratamientos',
    )
    descripcion = models.TextField()
    indicaciones = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    estado = models.CharField(
        max_length=20, choices=EstadoTratamiento.choices, default=EstadoTratamiento.ACTIVO
    )
    id_especialista = models.ForeignKey(
        'especialistas.Especialista', on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_especialista', related_name='tratamientos',
    )

    class Meta:
        db_table = 'tratamientos_clinicos'
        verbose_name = 'Tratamiento Clínico'
        verbose_name_plural = 'Tratamientos Clínicos'

    def __str__(self):
        return f'Tratamiento {self.id_tratamiento} ({self.estado})'

from django.conf import settings
from django.db import models
from django.utils import timezone

class TipoAntecedente(models.TextChoices):
    MEDICO = 'MEDICO', 'Médico'
    OFTALMOLOGICO = 'OFTALMOLOGICO', 'Oftalmológico'
    ALERGIA = 'ALERGIA', 'Alergia'
    FAMILIAR = 'FAMILIAR', 'Familiar'
    QUIRURGICO = 'QUIRURGICO', 'Quirúrgico'
    OTRO = 'OTRO', 'Otro'

class AntecedenteClinico(models.Model):
    id_antecedente = models.BigAutoField(primary_key=True)
    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica', on_delete=models.CASCADE,
        db_column='id_historia_clinica', related_name='antecedentes',
    )
    tipo_antecedente = models.CharField(max_length=20, choices=TipoAntecedente.choices)
    descripcion = models.TextField()
    fecha_registro = models.DateTimeField(default=timezone.now)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='registrado_por', related_name='antecedentes_registrados',
    )

    class Meta:
        db_table = 'antecedentes_clinicos'
        verbose_name = 'Antecedente Clínico'
        verbose_name_plural = 'Antecedentes Clínicos'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f'{self.tipo_antecedente} — HC {self.id_historia_clinica_id}'

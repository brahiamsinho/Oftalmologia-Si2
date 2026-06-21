from datetime import date

from django.conf import settings
from django.db import models
from django.utils import timezone


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
        max_length=20,
        choices=EstadoHistoriaClinica.choices,
        default=EstadoHistoriaClinica.ACTIVA,
    )

    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'historias_clinicas'
        verbose_name = 'Historia Clínica'
        verbose_name_plural = 'Historias Clínicas'

    def __str__(self):
        return f'HC-{self.id_paciente_id} ({self.estado})'


class TipoDocumentoClinico(models.TextChoices):
    RECETA = 'RECETA', 'Receta'
    INDICACION = 'INDICACION', 'Indicación'


class EstadoDocumentoClinico(models.TextChoices):
    BORRADOR = 'BORRADOR', 'Borrador'
    AUTORIZADO = 'AUTORIZADO', 'Autorizado'
    ANULADO = 'ANULADO', 'Anulado'


class DocumentoClinicoAutorizado(models.Model):
    id_documento_clinico = models.BigAutoField(primary_key=True)

    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica',
        on_delete=models.CASCADE,
        db_column='id_historia_clinica',
        related_name='documentos_clinicos',
    )

    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='documentos_clinicos',
    )

    tipo_documento = models.CharField(
        max_length=20,
        choices=TipoDocumentoClinico.choices,
        default=TipoDocumentoClinico.RECETA,
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadoDocumentoClinico.choices,
        default=EstadoDocumentoClinico.BORRADOR,
    )

    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    nombre_archivo_descarga = models.CharField(max_length=180, blank=True, default='')

    fecha_emision = models.DateTimeField(default=timezone.now)
    autorizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='autorizado_por',
        related_name='documentos_clinicos_autorizados',
    )
    autorizado_en = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documentos_clinicos_autorizados'
        verbose_name = 'Documento Clínico Autorizado'
        verbose_name_plural = 'Documentos Clínicos Autorizados'
        ordering = ['-autorizado_en', '-fecha_emision', '-created_at']
        indexes = [
            models.Index(fields=['id_historia_clinica', 'estado']),
            models.Index(fields=['id_paciente', 'estado']),
        ]

    def autorizar(self, usuario):
        self.estado = EstadoDocumentoClinico.AUTORIZADO
        self.autorizado_por = usuario
        self.autorizado_en = timezone.now()

    def __str__(self):
        return f'{self.get_tipo_documento_display()} #{self.id_documento_clinico} - HC {self.id_historia_clinica_id}'

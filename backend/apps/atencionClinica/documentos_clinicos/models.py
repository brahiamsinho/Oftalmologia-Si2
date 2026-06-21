from django.conf import settings
from django.db import models
from django.utils import timezone


class TipoDocumentoClinico(models.TextChoices):
    RECETA = 'RECETA', 'Receta'
    INDICACION = 'INDICACION', 'Indicación'


class EstadoDocumentoClinico(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    REVOCADO = 'REVOCADO', 'Revocado'
    VENCIDO = 'VENCIDO', 'Vencido'


class DocumentoClinicoAutorizado(models.Model):
    id_documento_clinico = models.BigAutoField(primary_key=True)

    id_historia_clinica = models.ForeignKey(
        'historial_clinico.HistoriaClinica',
        on_delete=models.CASCADE,
        db_column='id_historia_clinica',
        related_name='documentos_clinicos',
    )

    tipo_documento = models.CharField(
        max_length=20,
        choices=TipoDocumentoClinico.choices,
    )
    titulo = models.CharField(max_length=200)
    contenido = models.TextField(blank=True, null=True)
    archivo = models.FileField(upload_to='documentos_clinicos/', blank=True, null=True)

    estado = models.CharField(
        max_length=20,
        choices=EstadoDocumentoClinico.choices,
        default=EstadoDocumentoClinico.ACTIVO,
    )

    fecha_emision = models.DateTimeField(default=timezone.now)
    fecha_vencimiento = models.DateField(blank=True, null=True)

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        db_column='id_creado_por',
        related_name='documentos_clinicos_emitidos',
    )

    origen_modulo = models.CharField(max_length=80, blank=True, null=True)
    origen_registro_id = models.BigIntegerField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'documentos_clinicos_autorizados'
        verbose_name = 'Documento Clínico Autorizado'
        verbose_name_plural = 'Documentos Clínicos Autorizados'
        ordering = ['-fecha_emision', '-id_documento_clinico']

    def __str__(self):
        return f'{self.titulo} ({self.get_tipo_documento_display()})'

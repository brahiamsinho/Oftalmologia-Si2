import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class IntencionAsistente(models.TextChoices):
    CITAS_HORARIOS = 'CITAS_HORARIOS', 'Citas y horarios'
    PROCEDIMIENTOS = 'PROCEDIMIENTOS', 'Procedimientos'
    PREOPERATORIO = 'PREOPERATORIO', 'Indicaciones preoperatorias'
    POSTOPERATORIO = 'POSTOPERATORIO', 'Cuidados postoperatorios'
    SEGUROS_FACTURACION = 'SEGUROS_FACTURACION', 'Seguros y facturacion'
    SISTEMA = 'SISTEMA', 'Uso del sistema'
    SALUDO = 'SALUDO', 'Saludo'
    URGENCIA = 'URGENCIA', 'Sintomas o posible urgencia'
    FUERA_ALCANCE = 'FUERA_ALCANCE', 'Fuera del alcance'
    NO_COMPRENDIDA = 'NO_COMPRENDIDA', 'No comprendida'


class EstadoRespuestaAsistente(models.TextChoices):
    RESPONDIDA = 'RESPONDIDA', 'Respondida'
    REQUIERE_CU24 = 'REQUIERE_CU24', 'Requiere clasificacion CU24'
    FUERA_ALCANCE = 'FUERA_ALCANCE', 'Fuera del alcance'
    NO_COMPRENDIDA = 'NO_COMPRENDIDA', 'No comprendida'


class NivelPrioridadUrgencia(models.TextChoices):
    NO_APLICA = 'NO_APLICA', 'No aplica'
    BAJA = 'BAJA', 'Baja'
    MEDIA = 'MEDIA', 'Media'
    ALTA = 'ALTA', 'Alta'


class NivelUrgenciaClasificacion(models.TextChoices):
    BAJA = 'BAJA', 'Baja'
    MEDIA = 'MEDIA', 'Media'
    ALTA = 'ALTA', 'Alta'
    CRITICA = 'CRITICA', 'Crítica'


class EstadoClasificacionUrgencia(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    REVISADO = 'REVISADO', 'Revisado'
    DERIVADO = 'DERIVADO', 'Derivado'


class InteraccionAsistenteVirtual(models.Model):
    id_interaccion = models.BigAutoField(primary_key=True)
    id_conversacion = models.UUIDField(default=uuid.uuid4, db_index=True)
    id_usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='interacciones_asistente_virtual',
    )
    mensaje = models.TextField()
    respuesta = models.TextField()
    intencion = models.CharField(
        max_length=40,
        choices=IntencionAsistente.choices,
        db_index=True,
    )
    estado = models.CharField(
        max_length=30,
        choices=EstadoRespuestaAsistente.choices,
        default=EstadoRespuestaAsistente.RESPONDIDA,
        db_index=True,
    )
    requiere_clasificacion_urgencia = models.BooleanField(default=False)
    nivel_prioridad = models.CharField(
        max_length=20,
        choices=NivelPrioridadUrgencia.choices,
        default=NivelPrioridadUrgencia.NO_APLICA,
    )
    sintomas_detectados = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_origen = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ia_interacciones_asistente_virtual'
        verbose_name = 'Interaccion del asistente virtual'
        verbose_name_plural = 'Interacciones del asistente virtual'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['id_usuario', '-fecha_creacion']),
            models.Index(fields=['id_conversacion', '-fecha_creacion']),
            models.Index(fields=['requiere_clasificacion_urgencia', 'nivel_prioridad']),
        ]

    def __str__(self):
        return f'Interaccion #{self.id_interaccion} - {self.intencion}'


class ClasificacionUrgencia(models.Model):
    id_clasificacion = models.BigAutoField(primary_key=True)
    id_interaccion = models.OneToOneField(
        InteraccionAsistenteVirtual,
        on_delete=models.CASCADE,
        db_column='id_interaccion',
        related_name='clasificacion_urgencia',
    )
    id_usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='clasificaciones_urgencia',
    )
    nivel_urgencia = models.CharField(
        max_length=20,
        choices=NivelUrgenciaClasificacion.choices,
        db_index=True,
    )
    puntaje_riesgo = models.PositiveSmallIntegerField(default=0)
    factores_clinicos = models.JSONField(default=list, blank=True)
    criterios_evaluados = models.JSONField(default=dict, blank=True)
    recomendacion = models.TextField()
    requiere_derivacion = models.BooleanField(default=False)
    estado = models.CharField(
        max_length=20,
        choices=EstadoClasificacionUrgencia.choices,
        default=EstadoClasificacionUrgencia.PENDIENTE,
        db_index=True,
    )
    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='clasificaciones_urgencia_revisadas',
        blank=True,
        null=True,
    )
    fecha_revision = models.DateTimeField(blank=True, null=True)
    notas_internas = models.TextField(blank=True, default='')
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ia_clasificaciones_urgencia'
        verbose_name = 'Clasificacion de urgencia'
        verbose_name_plural = 'Clasificaciones de urgencia'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['estado', 'nivel_urgencia']),
            models.Index(fields=['id_usuario', '-fecha_creacion']),
        ]

    def __str__(self):
        return f'Clasificacion #{self.id_clasificacion} - {self.nivel_urgencia}'

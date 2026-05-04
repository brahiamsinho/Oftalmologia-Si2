from django.conf import settings
from django.db import models
from django.utils import timezone


class EstadoCampana(models.TextChoices):
    BORRADOR = 'BORRADOR', 'Borrador'
    ACTIVA = 'ACTIVA', 'Activa'
    PAUSADA = 'PAUSADA', 'Pausada'
    FINALIZADA = 'FINALIZADA', 'Finalizada'


class CanalContacto(models.TextChoices):
    LLAMADA = 'LLAMADA', 'Llamada'
    WHATSAPP = 'WHATSAPP', 'WhatsApp'
    EMAIL = 'EMAIL', 'Email'
    SMS = 'SMS', 'SMS'
    OTRO = 'OTRO', 'Otro'


class SegmentacionPaciente(models.Model):
    id_segmentacion = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=120, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    criterios = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_segmentaciones'
        verbose_name = 'Segmentacion de pacientes'
        verbose_name_plural = 'Segmentaciones de pacientes'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class CampanaCRM(models.Model):
    id_campana = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    id_segmentacion = models.ForeignKey(
        SegmentacionPaciente,
        on_delete=models.PROTECT,
        db_column='id_segmentacion',
        related_name='campanas',
    )
    estado = models.CharField(max_length=20, choices=EstadoCampana.choices, default=EstadoCampana.BORRADOR)
    fecha_inicio = models.DateField(default=timezone.now)
    fecha_fin = models.DateField(blank=True, null=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='creado_por',
        related_name='campanas_crm_creadas',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_campanas'
        verbose_name = 'Campana CRM'
        verbose_name_plural = 'Campanas CRM'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.nombre} ({self.estado})'


class HistorialContacto(models.Model):
    id_historial_contacto = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='crm_historial_contactos',
    )
    id_campana = models.ForeignKey(
        CampanaCRM,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_campana',
        related_name='historial_contactos',
    )
    canal = models.CharField(max_length=20, choices=CanalContacto.choices)
    fecha_contacto = models.DateTimeField(default=timezone.now)
    resultado = models.CharField(max_length=150, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    contactado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='contactado_por',
        related_name='crm_contactos_registrados',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_historial_contactos'
        verbose_name = 'Historial de contacto'
        verbose_name_plural = 'Historiales de contacto'
        ordering = ['-fecha_contacto', '-created_at']

    def __str__(self):
        return f'Contacto #{self.id_historial_contacto} - Paciente {self.id_paciente_id}'

"""
apps/backup/models.py
Modelos para sistema de backup/restore por tenant.
"""
from datetime import time, timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class EstadoBackup(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    EN_PROGRESO = 'EN_PROGRESO', 'En Progreso'
    COMPLETADO = 'COMPLETADO', 'Completado'
    FALLIDO = 'FALLIDO', 'Fallido'
    RESTAURADO = 'RESTAURADO', 'Restaurado'
    EXPIRADO = 'EXPIRADO', 'Expirado'


class FrecuenciaBackup(models.TextChoices):
    DAILY = 'daily', 'Diaria'
    WEEKLY = 'weekly', 'Semanal'


class TenantBackup(models.Model):
    """
    Registro de cada backup ejecutado por un tenant.
    Almacena metadata: archivo, tamaño, estado, fechas, quién lo creó/restauró.
    """
    id_backup = models.BigAutoField(primary_key=True)

    archivo = models.CharField(
        max_length=500,
        help_text='Ruta del archivo en storage (ej: backups/123/20260509_030000.sql.gz)',
    )
    tamaño_mb = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Tamaño del backup en MB',
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoBackup.choices,
        default=EstadoBackup.PENDIENTE,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    expira_en = models.DateTimeField(
        help_text='Fecha de expiración según retención del plan',
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='backups_creados',
    )

    # Campos de restore
    restaurado_en = models.DateTimeField(null=True, blank=True)
    restaurado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='backups_restaurados',
    )
    motivo_restore = models.TextField(
        blank=True,
        default='',
        help_text='Motivo de la restauración (obligatorio para auditoría)',
    )

    class Meta:
        db_table = 'tenant_backups'
        verbose_name = 'Backup de organización'
        verbose_name_plural = 'Backups de organizaciones'
        ordering = ['-creado_en']
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['creado_en']),
            models.Index(fields=['expira_en']),
        ]

    def __str__(self):
        return f'Backup {self.id_backup} - {self.estado} ({self.creado_en:%Y-%m-%d %H:%M})'

    @property
    def esta_vigente(self):
        """Retorna True si el backup no ha expirado."""
        return timezone.now() <= self.expira_en and self.estado == EstadoBackup.COMPLETADO

    @property
    def dias_restantes(self):
        """Días restantes antes de expirar."""
        if not self.expira_en:
            return None
        delta = self.expira_en - timezone.now()
        return max(0, delta.days)


class TenantBackupConfig(models.Model):
    """
    Configuración de backups automáticos por tenant.
    Permite al superadmin y al tenant admin definir hora, frecuencia y retención.
    """
    id_config = models.BigAutoField(primary_key=True)

    backup_automatico = models.BooleanField(
        default=True,
        help_text='Si está activado, se ejecutan backups automáticos',
    )
    hora_backup = models.TimeField(
        default=time(3, 0),
        help_text='Hora del backup automático (America/La_Paz)',
    )
    frecuencia = models.CharField(
        max_length=10,
        choices=FrecuenciaBackup.choices,
        default=FrecuenciaBackup.DAILY,
        help_text='Frecuencia de backups automáticos',
    )
    retencion_dias = models.IntegerField(
        default=7,
        help_text='Días de retención de backups',
    )

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_backup_configs'
        verbose_name = 'Configuración de Backup Automático'
        verbose_name_plural = 'Configuraciones de Backup Automático'

    def __str__(self):
        return f'Config backup - {self.hora_backup} ({self.frecuencia})'

    def clean(self):
        super().clean()
        if self.retencion_dias < 1:
            raise models.ValidationError('La retención debe ser al menos 1 día')
        if self.retencion_dias > 365:
            raise models.ValidationError('La retención no puede exceder 365 días')

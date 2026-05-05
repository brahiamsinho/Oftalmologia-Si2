"""
apps/bitacora/models.py
Registro de actividades del sistema para seguridad y trazabilidad.
App independiente para mantener separación de dominios.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.tenant.managers import TenantManager
from apps.tenant.utils import resolve_tenant_for_write


class AccionBitacora(models.TextChoices):
    LOGIN = 'LOGIN', 'Inicio de sesión'
    LOGOUT = 'LOGOUT', 'Cierre de sesión'
    LOGIN_FALLIDO = 'LOGIN_FALLIDO', 'Login fallido'
    CREAR = 'CREAR', 'Crear registro'
    EDITAR = 'EDITAR', 'Editar registro'
    ELIMINAR = 'ELIMINAR', 'Eliminar registro'
    CAMBIAR_PASSWORD = 'CAMBIAR_PASSWORD', 'Cambio de contraseña'
    RECUPERAR_PASSWORD = 'RECUPERAR_PASSWORD', 'Recuperación de contraseña'
    REPROGRAMAR = 'REPROGRAMAR', 'Reprogramar cita'
    CANCELAR = 'CANCELAR', 'Cancelar cita'
    CONFIRMAR = 'CONFIRMAR', 'Confirmar cita'


class Bitacora(models.Model):
    """
    Registro de actividades importantes para seguridad y trazabilidad.
    El campo id_usuario es nullable (SET_NULL) para conservar registros
    incluso si el usuario es eliminado.
    """
    id_bitacora = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tenant',
        related_name='bitacoras',
    )
    id_usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_usuario',
        related_name='bitacora_eventos',
    )
    modulo = models.CharField(max_length=100)
    tabla_afectada = models.CharField(max_length=100, blank=True, null=True)
    id_registro_afectado = models.BigIntegerField(null=True, blank=True)
    accion = models.CharField(max_length=30, choices=AccionBitacora.choices)
    descripcion = models.TextField(blank=True, null=True)
    ip_origen = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    fecha_evento = models.DateTimeField(default=timezone.now)

    objects = TenantManager()

    class Meta:
        db_table = 'bitacora'
        verbose_name = 'Evento de Bitácora'
        verbose_name_plural = 'Bitácora'
        ordering = ['-fecha_evento']

    def __str__(self):
        user = self.id_usuario or 'Sistema'
        return f'[{self.fecha_evento:%Y-%m-%d %H:%M}] {self.accion} — {self.modulo} ({user})'

    def save(self, *args, **kwargs):
        if self._state.adding and self.tenant_id is None:
            related_tenant = getattr(self.id_usuario, 'tenant', None)
            self.tenant = resolve_tenant_for_write(related_tenant=related_tenant)
        super().save(*args, **kwargs)

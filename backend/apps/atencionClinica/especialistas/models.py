"""
apps/specialists/models.py
Dominio de especialistas médicos del sistema.
Un Especialista es un Usuario con tipo_usuario=MEDICO o ESPECIALISTA
que atiende consultas, diagnostica y prescribe tratamientos.
"""
from django.conf import settings
from django.db import models

from apps.tenant.managers import TenantManager
from apps.tenant.utils import resolve_tenant_for_write


class Especialista(models.Model):
    """
    Médicos y especialistas que atienden citas y registran
    información clínica en las historias de los pacientes.
    Relación 1:1 con Usuario — usa settings.AUTH_USER_MODEL
    para evitar imports circulares.
    """
    id_especialista = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tenant',
        related_name='especialistas',
    )
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='especialista',
    )
    codigo_profesional = models.CharField(
        max_length=50, unique=True, null=True, blank=True
    )
    especialidad = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'especialistas'
        verbose_name = 'Especialista'
        verbose_name_plural = 'Especialistas'
        ordering = ['usuario__apellidos', 'usuario__nombres']

    objects = TenantManager()

    def __str__(self):
        return f'{self.usuario.get_full_name()} — {self.especialidad}'

    def get_full_name(self):
        return self.usuario.get_full_name()

    def save(self, *args, **kwargs):
        if self._state.adding and self.tenant_id is None:
            related_tenant = getattr(self.usuario, 'tenant', None)
            self.tenant = resolve_tenant_for_write(related_tenant=related_tenant)
        super().save(*args, **kwargs)

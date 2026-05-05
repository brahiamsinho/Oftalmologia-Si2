from datetime import date
from django.db import models

from apps.tenant.managers import TenantManager
from apps.tenant.utils import resolve_tenant_for_write

class EstadoHistoriaClinica(models.TextChoices):
    ACTIVA = 'ACTIVA', 'Activa'
    CERRADA = 'CERRADA', 'Cerrada'
    ARCHIVADA = 'ARCHIVADA', 'Archivada'

class HistoriaClinica(models.Model):
    id_historia_clinica = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tenant',
        related_name='historias_clinicas',
    )
    id_paciente = models.OneToOneField(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='historia_clinica',
    )
    fecha_apertura = models.DateField(default=date.today)
    motivo_apertura = models.TextField(blank=True, null=True)
    estado = models.CharField(
        max_length=20, choices=EstadoHistoriaClinica.choices,
        default=EstadoHistoriaClinica.ACTIVA,
    )
    observaciones = models.TextField(blank=True, null=True)

    objects = TenantManager()

    class Meta:
        db_table = 'historias_clinicas'
        verbose_name = 'Historia Clínica'
        verbose_name_plural = 'Historias Clínicas'

    def __str__(self):
        return f'HC-{self.id_paciente_id} ({self.estado})'

    def save(self, *args, **kwargs):
        if self._state.adding and self.tenant_id is None:
            related_tenant = getattr(self.id_paciente, 'tenant', None)
            self.tenant = resolve_tenant_for_write(related_tenant=related_tenant)
        super().save(*args, **kwargs)

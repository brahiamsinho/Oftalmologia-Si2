"""
apps/appointments/models.py
Dominio de citas y agenda médica:
  TipoCita, DisponibilidadEspecialista, Cita
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.tenant.managers import TenantManager
from apps.tenant.utils import resolve_tenant_for_write


class TipoCitaNombre(models.TextChoices):
    CONSULTA = 'CONSULTA', 'Consulta'
    ESTUDIO = 'ESTUDIO', 'Estudio'
    CIRUGIA = 'CIRUGIA', 'Cirugía'
    SEGUIMIENTO_POSTOPERATORIO = 'SEGUIMIENTO_POSTOPERATORIO', 'Seguimiento Postoperatorio'


class EstadoCita(models.TextChoices):
    PROGRAMADA = 'PROGRAMADA', 'Programada'
    CONFIRMADA = 'CONFIRMADA', 'Confirmada'
    REPROGRAMADA = 'REPROGRAMADA', 'Reprogramada'
    CANCELADA = 'CANCELADA', 'Cancelada'
    ATENDIDA = 'ATENDIDA', 'Atendida'
    NO_ASISTIO = 'NO_ASISTIO', 'No Asistió'


class TipoCita(models.Model):
    """Tipos de cita disponibles en el sistema."""
    id_tipo_cita = models.BigAutoField(primary_key=True)
    nombre = models.CharField(
        max_length=40, choices=TipoCitaNombre.choices, unique=True
    )
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'tipos_cita'
        verbose_name = 'Tipo de Cita'
        verbose_name_plural = 'Tipos de Cita'

    def __str__(self):
        return self.get_nombre_display()


class DisponibilidadEspecialista(models.Model):
    """
    Horarios base del especialista para la agenda médica.
    dia_semana: 1=Lunes … 7=Domingo
    """
    id_disponibilidad = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tenant',
        related_name='disponibilidades_especialista',
    )
    id_especialista = models.ForeignKey(
        'especialistas.Especialista',
        on_delete=models.CASCADE,
        db_column='id_especialista',
        related_name='disponibilidades',
    )
    dia_semana = models.IntegerField(help_text='1=Lunes, 2=Martes, ..., 7=Domingo')
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    intervalo_minutos = models.IntegerField(default=30)
    fecha_desde = models.DateField(null=True, blank=True)
    fecha_hasta = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    objects = TenantManager()

    class Meta:
        db_table = 'disponibilidades_especialista'
        verbose_name = 'Disponibilidad de Especialista'
        verbose_name_plural = 'Disponibilidades de Especialistas'
        ordering = ['id_especialista', 'dia_semana', 'hora_inicio']

    def __str__(self):
        dias = {1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom'}
        return f'{self.id_especialista} — {dias.get(self.dia_semana, "?")} {self.hora_inicio}-{self.hora_fin}'

    def save(self, *args, **kwargs):
        if self._state.adding and self.tenant_id is None:
            related_tenant = getattr(self.id_especialista, 'tenant', None)
            self.tenant = resolve_tenant_for_write(related_tenant=related_tenant)
        super().save(*args, **kwargs)


class Cita(models.Model):
    """
    Programación, reprogramación, cancelación, confirmación y control de citas.
    """
    id_cita = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tenant',
        related_name='citas',
    )
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='citas',
    )
    id_especialista = models.ForeignKey(
        'especialistas.Especialista',
        on_delete=models.RESTRICT,
        db_column='id_especialista',
        related_name='citas',
    )
    id_tipo_cita = models.ForeignKey(
        TipoCita,
        on_delete=models.RESTRICT,
        db_column='id_tipo_cita',
        related_name='citas',
    )
    fecha_hora_inicio = models.DateTimeField()
    fecha_hora_fin = models.DateTimeField()
    estado = models.CharField(
        max_length=30, choices=EstadoCita.choices, default=EstadoCita.PROGRAMADA
    )
    motivo = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    confirmada_en = models.DateTimeField(null=True, blank=True)
    id_cita_reprogramada_desde = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_cita_reprogramada_desde',
        related_name='reprogramaciones',
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='creado_por',
        related_name='citas_creadas',
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)

    objects = TenantManager()

    class Meta:
        db_table = 'citas'
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        ordering = ['fecha_hora_inicio']

    def __str__(self):
        return (
            f'Cita {self.id_cita} — {self.id_paciente} con {self.id_especialista} '
            f'[{self.fecha_hora_inicio:%Y-%m-%d %H:%M}] ({self.estado})'
        )

    def save(self, *args, **kwargs):
        if self._state.adding and self.tenant_id is None:
            related_tenant = getattr(self.id_paciente, 'tenant', None)
            if related_tenant is None:
                related_tenant = getattr(self.id_especialista, 'tenant', None)
            if related_tenant is None:
                related_tenant = getattr(self.creado_por, 'tenant', None)
            self.tenant = resolve_tenant_for_write(related_tenant=related_tenant)
        super().save(*args, **kwargs)

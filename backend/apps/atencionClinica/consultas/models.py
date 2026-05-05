from django.db import models

from apps.tenant.managers import TenantManager
from apps.tenant.utils import resolve_tenant_for_write
from apps.pacientes.pacientes.models import Paciente
from apps.usuarios.users.models import Usuario
from apps.atencionClinica.citas.models import Cita

class Consulta(models.Model):
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tenant',
        related_name='consultas',
    )
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='consultas')
    cita = models.ForeignKey(Cita, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultas')
    especialista = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='consultas_realizadas')
    
    fecha = models.DateTimeField(auto_now_add=True)
    motivo = models.TextField()
    sintomas = models.TextField(blank=True)
    notas_clinicas = models.TextField(blank=True)

    # Examen de ojos básico (PIO; agudeza → app medicion_visual.MedicionVisual)
    presion_intraocular_od = models.CharField(max_length=50, blank=True, null=True, verbose_name="Presión Intraocular Ojo Derecho")
    presion_intraocular_oi = models.CharField(max_length=50, blank=True, null=True, verbose_name="Presión Intraocular Ojo Izquierdo")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantManager()

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Consulta'
        verbose_name_plural = 'Consultas'

    def __str__(self):
        return f"Consulta de {self.paciente} el {self.fecha.strftime('%Y-%m-%d')}"

    def save(self, *args, **kwargs):
        if self._state.adding and self.tenant_id is None:
            related_tenant = getattr(self.paciente, 'tenant', None)
            if related_tenant is None:
                related_tenant = getattr(self.cita, 'tenant', None)
            if related_tenant is None:
                related_tenant = getattr(self.especialista, 'tenant', None)
            self.tenant = resolve_tenant_for_write(related_tenant=related_tenant)
        super().save(*args, **kwargs)

class Estudio(models.Model):
    tenant = models.ForeignKey(
        'tenant.Tenant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tenant',
        related_name='estudios',
    )
    TIPO_ESTUDIO_CHOICES = [
        ('refraccion', 'Refracción'),
        ('tonometria', 'Tonometría (Presión Intraocular)'),
        ('fondo_ojo', 'Fondo de Ojo'),
        ('topografia', 'Topografía Corneal'),
        ('paquimetria', 'Paquimetría'),
        ('tomografia', 'Tomografía de Coherencia Óptica (OCT)'),
        ('campo_visual', 'Campo Visual'),
        ('otros', 'Otros'),
    ]

    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='estudios')
    consulta = models.ForeignKey(Consulta, on_delete=models.SET_NULL, null=True, blank=True, related_name='estudios')
    tipo_estudio = models.CharField(max_length=50, choices=TIPO_ESTUDIO_CHOICES, default='otros')
    
    # Valores de medición
    ojo_derecho = models.CharField(max_length=255, blank=True, null=True, verbose_name="Resultado Ojo Derecho")
    ojo_izquierdo = models.CharField(max_length=255, blank=True, null=True, verbose_name="Resultado Ojo Izquierdo")
    
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones Clínicas")
    archivo_resultado = models.FileField(upload_to='estudios/resultados/', blank=True, null=True, verbose_name="Archivo/Resultados")
    
    fecha = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantManager()

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Estudio Oftalmológico'
        verbose_name_plural = 'Estudios Oftalmológicos'

    def __str__(self):
        return f"{self.get_tipo_estudio_display()} - {self.paciente} ({self.fecha.strftime('%Y-%m-%d')})"

    def save(self, *args, **kwargs):
        if self._state.adding and self.tenant_id is None:
            related_tenant = getattr(self.paciente, 'tenant', None)
            if related_tenant is None:
                related_tenant = getattr(self.consulta, 'tenant', None)
            self.tenant = resolve_tenant_for_write(related_tenant=related_tenant)
        super().save(*args, **kwargs)

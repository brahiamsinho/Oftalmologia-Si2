"""
CU19 (PUDS) — Descuentos y campañas clínicas (distinto de CampanaCRM / CU16).
"""
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class TipoBeneficio(models.TextChoices):
    PORCENTAJE = 'PORCENTAJE', 'Porcentaje'
    MONTO_FIJO = 'MONTO_FIJO', 'Monto fijo'


class EstadoPromocion(models.TextChoices):
    BORRADOR = 'BORRADOR', 'Borrador'
    ACTIVA = 'ACTIVA', 'Activa'
    INACTIVA = 'INACTIVA', 'Inactiva'
    FINALIZADA = 'FINALIZADA', 'Finalizada'


class AlcancePromocion(models.TextChoices):
    GENERAL = 'GENERAL', 'Todos los pacientes'
    ASIGNADA = 'ASIGNADA', 'Solo pacientes asignados'


class CompatibilidadSeguro(models.TextChoices):
    CUALQUIERA = 'CUALQUIERA', 'Compatible con o sin seguro'
    SOLO_SIN_SEGURO = 'SOLO_SIN_SEGURO', 'Solo sin cobertura vigente'
    INCOMPATIBLE_SEGURO = 'INCOMPATIBLE_SEGURO', 'No acumular con seguro vigente'


class PromocionDescuento(models.Model):
    """Descuento o campaña promocional aplicable en atención/facturación."""

    id_promocion = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, default='')

    tipo_beneficio = models.CharField(
        max_length=20,
        choices=TipoBeneficio.choices,
        default=TipoBeneficio.PORCENTAJE,
    )
    valor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Porcentaje (0–100) o monto fijo según tipo_beneficio.',
    )

    alcance = models.CharField(
        max_length=20,
        choices=AlcancePromocion.choices,
        default=AlcancePromocion.GENERAL,
    )
    compatibilidad_seguro = models.CharField(
        max_length=30,
        choices=CompatibilidadSeguro.choices,
        default=CompatibilidadSeguro.CUALQUIERA,
    )
    acumulable = models.BooleanField(
        default=False,
        help_text='Si es False, no puede combinarse con otra promoción vigente del paciente.',
    )
    condiciones_aplicacion = models.TextField(
        blank=True,
        default='',
        help_text='Condiciones legibles para admisión/facturación.',
    )

    fecha_inicio = models.DateField(default=timezone.now)
    fecha_fin = models.DateField(null=True, blank=True)
    estado = models.CharField(
        max_length=20,
        choices=EstadoPromocion.choices,
        default=EstadoPromocion.BORRADOR,
        db_index=True,
    )

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='creado_por',
        related_name='promociones_creadas',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'descuentos_promociones'
        verbose_name = 'Promoción / descuento'
        verbose_name_plural = 'Promociones y descuentos'
        ordering = ['-fecha_inicio', 'nombre']

    def __str__(self) -> str:
        return f'{self.nombre} ({self.codigo})'

    @property
    def vigente_hoy(self) -> bool:
        if self.estado != EstadoPromocion.ACTIVA:
            return False
        hoy = timezone.localdate()
        if self.fecha_inicio > hoy:
            return False
        if self.fecha_fin and self.fecha_fin < hoy:
            return False
        return True


class BeneficioPaciente(models.Model):
    """Asigna una promoción a un paciente (alcance ASIGNADA)."""

    id_beneficio = models.BigAutoField(primary_key=True)

    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='beneficios_asignados',
    )
    id_promocion = models.ForeignKey(
        PromocionDescuento,
        on_delete=models.CASCADE,
        db_column='id_promocion',
        related_name='asignaciones_paciente',
    )

    fecha_asignacion = models.DateField(default=timezone.now)
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True, db_index=True)
    notificado = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'descuentos_beneficios_paciente'
        verbose_name = 'Beneficio asignado'
        verbose_name_plural = 'Beneficios asignados'
        ordering = ['-fecha_asignacion']
        constraints = [
            models.UniqueConstraint(
                fields=['id_paciente', 'id_promocion'],
                name='descuentos_beneficio_paciente_promo_uniq',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.id_paciente_id} — {self.id_promocion.codigo}'

    @property
    def vigente_hoy(self) -> bool:
        if not self.activo:
            return False
        if not self.id_promocion.vigente_hoy:
            return False
        hoy = timezone.localdate()
        if self.fecha_asignacion > hoy:
            return False
        if self.fecha_fin and self.fecha_fin < hoy:
            return False
        return True

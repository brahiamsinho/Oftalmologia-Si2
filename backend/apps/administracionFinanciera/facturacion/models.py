"""
CU20 (PUDS) — Facturación, cobros y referencia a pasarela (clínica por tenant).

Distinto de suscripción SaaS (Stripe/plataforma). Integra seguros (CU18) y descuentos (CU19).
"""
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class TipoServicioClinico(models.TextChoices):
    CONSULTA = 'CONSULTA', 'Consulta'
    ESTUDIO = 'ESTUDIO', 'Estudio'
    CIRUGIA = 'CIRUGIA', 'Cirugía'
    CONTROL = 'CONTROL', 'Control / seguimiento'


class EstadoFactura(models.TextChoices):
    BORRADOR = 'BORRADOR', 'Borrador'
    EMITIDA = 'EMITIDA', 'Emitida'
    PAGADA_PARCIAL = 'PAGADA_PARCIAL', 'Pagada parcial'
    PAGADA = 'PAGADA', 'Pagada'
    ANULADA = 'ANULADA', 'Anulada'


class MetodoPagoClinico(models.TextChoices):
    EFECTIVO      = 'EFECTIVO',      'Efectivo'
    TARJETA       = 'TARJETA',       'Tarjeta'
    TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia bancaria'
    EN_LINEA      = 'EN_LINEA',      'Pago en línea'
    QR            = 'QR',            'Pago QR'


class EstadoCobro(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    CONFIRMADO = 'CONFIRMADO', 'Confirmado'
    RECHAZADO = 'RECHAZADO', 'Rechazado'
    ANULADO = 'ANULADO', 'Anulado'


class CatalogoServicioClinico(models.Model):
    """Tarifario base de la clínica (consulta, estudio, cirugía, etc.)."""

    id_servicio = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, default='')
    tipo_servicio = models.CharField(max_length=20, choices=TipoServicioClinico.choices)
    id_tipo_cita = models.ForeignKey(
        'citas.TipoCita',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_tipo_cita',
        related_name='servicios_facturacion',
    )
    precio_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    activo = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'facturacion_catalogo_servicios'
        verbose_name = 'Servicio clínico (tarifa)'
        verbose_name_plural = 'Catálogo de servicios clínicos'
        ordering = ['tipo_servicio', 'nombre']

    def __str__(self) -> str:
        return f'{self.nombre} ({self.codigo})'


class FacturaClinica(models.Model):
    """Comprobante de cobro por atención clínica."""

    id_factura = models.BigAutoField(primary_key=True)
    numero_factura = models.CharField(max_length=30, unique=True, blank=True)

    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.PROTECT,
        db_column='id_paciente',
        related_name='facturas_clinicas',
    )
    id_servicio = models.ForeignKey(
        CatalogoServicioClinico,
        on_delete=models.PROTECT,
        db_column='id_servicio',
        related_name='facturas',
    )
    id_cita = models.ForeignKey(
        'citas.Cita',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_cita',
        related_name='facturas',
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadoFactura.choices,
        default=EstadoFactura.BORRADOR,
        db_index=True,
    )
    fecha_emision = models.DateField(default=timezone.now)
    fecha_referencia_calculo = models.DateField(
        help_text='Fecha usada para vigencia de seguro/descuento.',
    )

    monto_base = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    monto_cobertura_seguro = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    copago_seguro = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    monto_descuento = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    monto_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Monto a cargo del paciente tras seguro y descuento.',
    )
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    id_promocion_aplicada = models.ForeignKey(
        'descuentos.PromocionDescuento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_promocion_aplicada',
        related_name='facturas',
    )
    detalle_calculo = models.JSONField(default=dict, blank=True)

    observaciones = models.TextField(blank=True, default='')

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='creado_por',
        related_name='facturas_clinicas_creadas',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'facturacion_facturas'
        verbose_name = 'Factura clínica'
        verbose_name_plural = 'Facturas clínicas'
        ordering = ['-fecha_emision', '-id_factura']

    def __str__(self) -> str:
        return self.numero_factura or f'Factura #{self.pk}'

    def save(self, *args, **kwargs):
        if not self.numero_factura:
            super().save(*args, **kwargs)
            self.numero_factura = f'FAC-{self.fecha_emision.year}-{self.pk:06d}'
            super().save(update_fields=['numero_factura'])
        else:
            super().save(*args, **kwargs)


class CobroClinico(models.Model):
    """Pago presencial o en línea aplicado a una factura."""

    id_cobro = models.BigAutoField(primary_key=True)

    id_factura = models.ForeignKey(
        FacturaClinica,
        on_delete=models.CASCADE,
        db_column='id_factura',
        related_name='cobros',
    )
    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    metodo_pago = models.CharField(max_length=20, choices=MetodoPagoClinico.choices)
    estado = models.CharField(
        max_length=20,
        choices=EstadoCobro.choices,
        default=EstadoCobro.CONFIRMADO,
        db_index=True,
    )
    referencia_pasarela = models.CharField(
        max_length=120,
        blank=True,
        default='',
        help_text='ID de transacción externa (pasarela) cuando metodo_pago=EN_LINEA.',
    )
    fecha_cobro = models.DateTimeField(default=timezone.now)
    observaciones = models.TextField(blank=True, default='')

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='registrado_por',
        related_name='cobros_clinicos_registrados',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'facturacion_cobros'
        verbose_name = 'Cobro clínico'
        verbose_name_plural = 'Cobros clínicos'
        ordering = ['-fecha_cobro']

    def __str__(self) -> str:
        return f'Cobro #{self.pk} — {self.monto} ({self.estado})'

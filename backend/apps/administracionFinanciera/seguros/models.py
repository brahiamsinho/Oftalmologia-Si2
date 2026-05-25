"""
CU18 (PUDS) — Seguros, convenios con aseguradoras y afiliación de pacientes.
"""
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class Aseguradora(models.Model):
    """Compañía aseguradora (ISAP, prepaga, etc.)."""

    id_aseguradora = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=150)
    razon_social = models.CharField(max_length=200, blank=True, default='')
    telefono = models.CharField(max_length=30, blank=True, default='')
    email = models.EmailField(max_length=120, blank=True, default='')
    activo = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seguros_aseguradoras'
        verbose_name = 'Aseguradora'
        verbose_name_plural = 'Aseguradoras'
        ordering = ['nombre']

    def __str__(self) -> str:
        return f'{self.nombre} ({self.codigo})'


class Convenio(models.Model):
    """Acuerdo de cobertura entre la clínica y una aseguradora."""

    id_convenio = models.BigAutoField(primary_key=True)

    id_aseguradora = models.ForeignKey(
        Aseguradora,
        on_delete=models.PROTECT,
        db_column='id_aseguradora',
        related_name='convenios',
    )
    codigo = models.CharField(max_length=40)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, default='')

    porcentaje_cobertura = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('80.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text='Porcentaje que cubre el convenio (0–100).',
    )
    copago_monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text='Copago fijo en moneda local (referencia administrativa).',
    )

    fecha_inicio = models.DateField(default=timezone.now)
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True, db_index=True)

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='creado_por',
        related_name='convenios_creados',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seguros_convenios'
        verbose_name = 'Convenio'
        verbose_name_plural = 'Convenios'
        ordering = ['-fecha_inicio', 'nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['id_aseguradora', 'codigo'],
                name='seguros_convenio_aseguradora_codigo_uniq',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.nombre} — {self.id_aseguradora.nombre}'

    @property
    def vigente_hoy(self) -> bool:
        if not self.activo:
            return False
        hoy = timezone.localdate()
        if self.fecha_inicio > hoy:
            return False
        if self.fecha_fin and self.fecha_fin < hoy:
            return False
        return True


class AfiliacionSeguroPaciente(models.Model):
    """Vincula un paciente con un convenio y número de afiliación/póliza."""

    id_afiliacion = models.BigAutoField(primary_key=True)

    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='afiliaciones_seguro',
    )
    id_convenio = models.ForeignKey(
        Convenio,
        on_delete=models.PROTECT,
        db_column='id_convenio',
        related_name='afiliaciones',
    )

    numero_afiliado = models.CharField(max_length=60)
    numero_poliza = models.CharField(max_length=60, blank=True, default='')
    titular_nombre = models.CharField(max_length=150, blank=True, default='')
    es_titular = models.BooleanField(default=True)
    es_principal = models.BooleanField(
        default=False,
        help_text='Cobertura principal del paciente para facturación/referencia.',
    )

    fecha_inicio = models.DateField(default=timezone.now)
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seguros_afiliaciones_paciente'
        verbose_name = 'Afiliación de seguro'
        verbose_name_plural = 'Afiliaciones de seguro'
        ordering = ['-es_principal', '-fecha_inicio']
        constraints = [
            models.UniqueConstraint(
                fields=['id_paciente', 'id_convenio', 'numero_afiliado'],
                name='seguros_afiliacion_paciente_convenio_num_uniq',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.id_paciente} — {self.id_convenio.nombre} [{self.numero_afiliado}]'

    @property
    def vigente_hoy(self) -> bool:
        if not self.activo:
            return False
        if not self.id_convenio.vigente_hoy:
            return False
        hoy = timezone.localdate()
        if self.fecha_inicio > hoy:
            return False
        if self.fecha_fin and self.fecha_fin < hoy:
            return False
        return True

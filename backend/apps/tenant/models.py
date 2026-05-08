from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django_tenants.models import DomainMixin, TenantMixin


class PlanCodigo(models.TextChoices):
    FREE = 'FREE', 'Free'
    PLUS = 'PLUS', 'Plus'
    PRO = 'PRO', 'Pro'


class EstadoSuscripcion(models.TextChoices):
    TRIAL = 'TRIAL', 'Trial'
    ACTIVA = 'ACTIVA', 'Activa'
    VENCIDA = 'VENCIDA', 'Vencida'
    CANCELADA = 'CANCELADA', 'Cancelada'
    SUSPENDIDA = 'SUSPENDIDA', 'Suspendida'


class Tenant(TenantMixin):
    id_tenant = models.BigAutoField(primary_key=True)

    slug = models.SlugField(max_length=80, unique=True)
    nombre = models.CharField(max_length=150)
    razon_social = models.CharField(max_length=180, blank=True, default='')
    nit = models.CharField(max_length=50, blank=True, default='')

    email_contacto = models.EmailField(blank=True, default='')
    telefono_contacto = models.CharField(max_length=40, blank=True, default='')

    activo = models.BooleanField(default=True)
    dominio_base = models.CharField(max_length=255, blank=True, null=True)

    auto_create_schema = True
    auto_drop_schema = False

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_tenants'
        verbose_name = 'Organización'
        verbose_name_plural = 'Organizaciones'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.schema_name})'

    @property
    def url_prefix(self):
        return f'/t/{self.slug}/'

    def clean(self):
        super().clean()
        if self.schema_name:
            normalized = self.schema_name.lower().replace('-', '_')
            if self.schema_name != normalized:
                raise ValidationError({'schema_name': 'Usa minúsculas y guion bajo. Ejemplo: clinica_demo.'})

        if self.schema_name == 'public' and self.slug != 'public':
            raise ValidationError({'slug': 'El schema public debe usar slug public.'})


class Domain(DomainMixin):
    class Meta:
        db_table = 'tenant_domains'
        verbose_name = 'Dominio'
        verbose_name_plural = 'Dominios'

    def __str__(self):
        return self.domain


class SubscriptionPlan(models.Model):
    id_plan = models.BigAutoField(primary_key=True)

    codigo = models.CharField(max_length=20, choices=PlanCodigo.choices, unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField(blank=True, default='')

    precio_mensual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    moneda = models.CharField(max_length=10, default='BOB')

    max_usuarios = models.PositiveIntegerField(default=3)
    max_pacientes = models.PositiveIntegerField(default=100)
    max_citas_mes = models.PositiveIntegerField(default=100)
    max_almacenamiento_mb = models.PositiveIntegerField(default=500)

    permite_crm = models.BooleanField(default=False)
    permite_notificaciones = models.BooleanField(default=False)
    permite_reportes_avanzados = models.BooleanField(default=False)
    permite_soporte_prioritario = models.BooleanField(default=False)

    activo = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_plans'
        verbose_name = 'Plan de suscripción'
        verbose_name_plural = 'Planes de suscripción'
        ordering = ['precio_mensual', 'codigo']

    def __str__(self):
        return f'{self.nombre} ({self.codigo})'


class TenantSubscription(models.Model):
    id_suscripcion = models.BigAutoField(primary_key=True)

    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='subscription',
        db_column='id_tenant',
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        db_column='id_plan',
    )

    estado = models.CharField(max_length=20, choices=EstadoSuscripcion.choices, default=EstadoSuscripcion.TRIAL)
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    trial_fin = models.DateTimeField(null=True, blank=True)

    renovar_automaticamente = models.BooleanField(default=False)
    proveedor_pago = models.CharField(max_length=40, blank=True, default='')
    referencia_pago = models.CharField(max_length=120, blank=True, default='')
    notas = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_subscriptions'
        verbose_name = 'Suscripción de organización'
        verbose_name_plural = 'Suscripciones de organizaciones'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f'{self.tenant.nombre} - {self.plan.codigo}'

    @property
    def esta_activa(self):
        if self.estado not in (EstadoSuscripcion.TRIAL, EstadoSuscripcion.ACTIVA):
            return False

        now = timezone.now()

        if self.estado == EstadoSuscripcion.TRIAL and self.trial_fin:
            return self.trial_fin >= now

        if self.fecha_fin:
            return self.fecha_fin >= now

        return True


class TenantUsage(models.Model):
    id_usage = models.BigAutoField(primary_key=True)

    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='usage',
        db_column='id_tenant',
    )

    usuarios_actuales = models.PositiveIntegerField(default=0)
    pacientes_actuales = models.PositiveIntegerField(default=0)
    citas_mes_actual = models.PositiveIntegerField(default=0)
    almacenamiento_usado_mb = models.PositiveIntegerField(default=0)

    periodo_anio = models.PositiveIntegerField(default=timezone.now().year)
    periodo_mes = models.PositiveIntegerField(default=timezone.now().month)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_usage'
        verbose_name = 'Uso de organización'
        verbose_name_plural = 'Usos de organizaciones'

    def __str__(self):
        return f'Uso de {self.tenant.nombre}'


class TenantSettings(models.Model):
    id_tenant_settings = models.BigAutoField(primary_key=True)

    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='settings',
        db_column='id_tenant',
    )

    timezone = models.CharField(max_length=64, default='America/La_Paz')
    idioma = models.CharField(max_length=10, default='es')

    branding_nombre = models.CharField(max_length=120, blank=True, default='')
    branding_color_primario = models.CharField(max_length=20, blank=True, default='')
    branding_color_secundario = models.CharField(max_length=20, blank=True, default='')
    branding_logo_url = models.URLField(blank=True, default='')

    flags = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_settings'
        verbose_name = 'Configuración de organización'
        verbose_name_plural = 'Configuraciones de organizaciones'
        ordering = ['tenant__nombre']

    def __str__(self):
        return f'Settings de {self.tenant.nombre}'

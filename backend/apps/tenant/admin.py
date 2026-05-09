from django.contrib import admin
from django_tenants.admin import TenantAdminMixin

from .models import (
    Domain,
    SubscriptionPlan,
    Tenant,
    TenantSettings,
    TenantSubscription,
    TenantUsage,
)


@admin.register(Tenant)
class TenantAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = (
        'id_tenant',
        'schema_name',
        'slug',
        'nombre',
        'activo',
        'dominio_base',
        'created_at',
    )
    list_filter = ('activo',)
    search_fields = (
        'schema_name',
        'slug',
        'nombre',
        'razon_social',
        'nit',
        'email_contacto',
        'dominio_base',
    )


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = (
        'domain',
        'tenant',
        'is_primary',
    )
    list_filter = ('is_primary',)
    search_fields = (
        'domain',
        'tenant__schema_name',
        'tenant__slug',
        'tenant__nombre',
    )


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        'id_plan',
        'codigo',
        'nombre',
        'precio_mensual',
        'moneda',
        'max_usuarios',
        'max_pacientes',
        'max_citas_mes',
        'activo',
    )
    list_filter = (
        'codigo',
        'activo',
        'permite_crm',
        'permite_notificaciones',
        'permite_reportes_avanzados',
    )
    search_fields = ('codigo', 'nombre', 'descripcion')


@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'id_suscripcion',
        'tenant',
        'plan',
        'estado',
        'fecha_inicio',
        'fecha_fin',
        'trial_fin',
        'renovar_automaticamente',
    )
    list_filter = ('estado', 'plan', 'renovar_automaticamente')
    search_fields = (
        'tenant__schema_name',
        'tenant__slug',
        'tenant__nombre',
        'plan__codigo',
        'referencia_pago',
    )


@admin.register(TenantUsage)
class TenantUsageAdmin(admin.ModelAdmin):
    list_display = (
        'id_usage',
        'tenant',
        'usuarios_actuales',
        'pacientes_actuales',
        'citas_mes_actual',
        'almacenamiento_usado_mb',
        'periodo_anio',
        'periodo_mes',
        'updated_at',
    )
    search_fields = (
        'tenant__schema_name',
        'tenant__slug',
        'tenant__nombre',
    )


@admin.register(TenantSettings)
class TenantSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'id_tenant_settings',
        'tenant',
        'timezone',
        'idioma',
        'branding_nombre',
        'created_at',
    )
    search_fields = (
        'tenant__schema_name',
        'tenant__slug',
        'tenant__nombre',
        'branding_nombre',
    )
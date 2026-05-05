from django.contrib import admin

from .models import Tenant, TenantSettings


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('id_tenant', 'slug', 'nombre', 'activo', 'dominio_base', 'created_at')
    list_filter = ('activo',)
    search_fields = ('slug', 'nombre', 'dominio_base')


@admin.register(TenantSettings)
class TenantSettingsAdmin(admin.ModelAdmin):
    list_display = ('id_tenant_settings', 'tenant', 'timezone', 'idioma', 'created_at')
    search_fields = ('tenant__slug', 'tenant__nombre', 'branding_nombre')

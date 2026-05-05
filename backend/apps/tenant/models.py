from django.db import models


class Tenant(models.Model):
    id_tenant = models.BigAutoField(primary_key=True)
    slug = models.SlugField(max_length=80, unique=True)
    nombre = models.CharField(max_length=120)
    activo = models.BooleanField(default=True)
    dominio_base = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_tenants'
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.slug})'


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
    flags = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_settings'
        verbose_name = 'Configuración de tenant'
        verbose_name_plural = 'Configuraciones de tenant'
        ordering = ['tenant__nombre']

    def __str__(self):
        return f'Settings de {self.tenant.nombre}'

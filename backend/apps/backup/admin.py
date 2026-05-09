"""
apps/backup/admin.py
Registro de modelos de backup en Django Admin.
"""
from django.contrib import admin

from apps.backup.models import TenantBackup, TenantBackupConfig


@admin.register(TenantBackup)
class TenantBackupAdmin(admin.ModelAdmin):
    list_display = [
        'id_backup',
        'estado',
        'tamaño_mb',
        'creado_en',
        'expira_en',
        'creado_por',
    ]
    list_filter = ['estado', 'creado_en']
    search_fields = ['archivo', 'creado_por__username']
    readonly_fields = ['creado_en', 'restaurado_en', 'restaurado_por', 'motivo_restore']
    date_hierarchy = 'creado_en'


@admin.register(TenantBackupConfig)
class TenantBackupConfigAdmin(admin.ModelAdmin):
    list_display = [
        'id_config',
        'backup_automatico',
        'hora_backup',
        'frecuencia',
        'retencion_dias',
        'actualizado_en',
    ]
    list_filter = ['backup_automatico', 'frecuencia']

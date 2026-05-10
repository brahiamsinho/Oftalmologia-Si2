from django.contrib import admin

from apps.reportes.models import ReportTemplate


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'is_system_report', 'created_by', 'created_at')
    list_filter = ('is_system_report',)
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('created_at',)

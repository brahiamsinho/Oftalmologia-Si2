from django.contrib import admin

from .models import PlatformAdministrator


@admin.register(PlatformAdministrator)
class PlatformAdministratorAdmin(admin.ModelAdmin):
    list_display = ('email', 'nombre', 'is_active', 'is_staff', 'created_at')
    list_filter = ('is_active', 'is_staff')
    search_fields = ('email', 'nombre')
    ordering = ('email',)

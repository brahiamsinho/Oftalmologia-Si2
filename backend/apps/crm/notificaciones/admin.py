from django.contrib import admin

from .models import DispositivoFcm


@admin.register(DispositivoFcm)
class DispositivoFcmAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'plataforma', 'actualizado_en')
    list_filter = ('plataforma',)
    search_fields = ('token', 'usuario__email', 'usuario__username')
    raw_id_fields = ('usuario',)

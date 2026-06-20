from django.contrib import admin

from apps.InteligenciaArtificial.models import InteraccionAsistenteVirtual


@admin.register(InteraccionAsistenteVirtual)
class InteraccionAsistenteVirtualAdmin(admin.ModelAdmin):
    list_display = (
        'id_interaccion',
        'id_usuario',
        'intencion',
        'estado',
        'nivel_prioridad',
        'requiere_clasificacion_urgencia',
        'fecha_creacion',
    )
    list_filter = (
        'intencion',
        'estado',
        'nivel_prioridad',
        'requiere_clasificacion_urgencia',
        'fecha_creacion',
    )
    search_fields = ('mensaje', 'respuesta', 'id_usuario__username', 'id_usuario__email')
    readonly_fields = (
        'id_interaccion',
        'id_conversacion',
        'id_usuario',
        'mensaje',
        'respuesta',
        'intencion',
        'estado',
        'requiere_clasificacion_urgencia',
        'nivel_prioridad',
        'sintomas_detectados',
        'metadata',
        'ip_origen',
        'user_agent',
        'fecha_creacion',
    )

    def has_add_permission(self, request):
        return False

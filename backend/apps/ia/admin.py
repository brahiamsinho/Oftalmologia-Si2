from django.contrib import admin

from apps.ia.models import ChatbotUrgencyClassification, CriticalHumanHandoff


@admin.register(ChatbotUrgencyClassification)
class ChatbotUrgencyClassificationAdmin(admin.ModelAdmin):
    list_display = (
        'id_clasificacion',
        'paciente',
        'usuario',
        'nivel',
        'confianza',
        'requiere_atencion_humana',
        'estado_derivacion',
        'created_at',
    )
    list_filter = ('nivel', 'requiere_atencion_humana', 'estado_derivacion', 'created_at')
    search_fields = ('paciente__nombres', 'paciente__apellidos', 'usuario__username', 'usuario__email')
    readonly_fields = (
        'id_clasificacion',
        'usuario',
        'paciente',
        'mensaje_usuario',
        'nivel',
        'confianza',
        'criterios_detectados',
        'orientacion',
        'requiere_atencion_humana',
        'estado_derivacion',
        'created_at',
        'updated_at',
    )

    def has_add_permission(self, request):
        return False


@admin.register(CriticalHumanHandoff)
class CriticalHumanHandoffAdmin(admin.ModelAdmin):
    list_display = (
        'id_handoff',
        'paciente',
        'estado',
        'asignado_a',
        'nivel_urgencia',
        'created_at',
    )
    list_filter = ('estado', 'nivel_urgencia', 'created_at')
    search_fields = ('paciente__nombres', 'paciente__apellidos')
    readonly_fields = (
        'id_handoff',
        'classification',
        'paciente',
        'mensaje_original',
        'nivel_urgencia',
        'criterios_detectados',
        'estado',
        'asignado_a',
        'aceptado_por',
        'notificado_en',
        'aceptado_en',
        'resuelto_en',
        'created_at',
        'updated_at',
    )

    def has_add_permission(self, request):
        return False

from django.contrib import admin
from .models import Receta, RecetaDetalle

class RecetaDetalleInline(admin.TabularInline):
    model = RecetaDetalle
    extra = 1

@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ['id_receta', 'id_historia_clinica', 'id_especialista', 'fecha_receta']
    inlines = [RecetaDetalleInline]

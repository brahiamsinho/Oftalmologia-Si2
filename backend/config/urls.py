"""
Oftalmología Si2 — URL Configuration
======================================
Todas las rutas del proyecto bajo /api/
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

api_patterns = [
    # Core — Health check
    path('', include('apps.core.urls')),

    # Auth + Usuarios
    path('', include('apps.users.urls')),

    # Roles y asignaciones usuario-rol
    path('', include('apps.roles.urls')),

    # Permisos granulares
    path('', include('apps.permisos.urls')),

    # Bitácora (app separada — solo lectura via API)
    path('', include('apps.bitacora.urls')),

    # Pacientes
    path('', include('apps.pacientes.urls')),

    # Especialistas
    path('', include('apps.especialistas.urls')),

    # Historias Clínicas (Ruta principal)
    path('', include('apps.historial_clinico.urls')),
    
    # Sub-registros de Historias Clínicas (Rutas anidadas)
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.antecedentes.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.diagnosticos.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.tratamientos.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.evoluciones.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.recetas.urls')),

    # Citas, Tipos de cita, Disponibilidades
    path('', include('apps.citas.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include((api_patterns, 'api'))),
]

# Media y static en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

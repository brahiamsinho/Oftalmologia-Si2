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

    path('', include('apps.usuarios.users.urls')),
    path('', include('apps.usuarios.roles.urls')),
    path('', include('apps.usuarios.permisos.urls')),
    path('', include('apps.bitacora.urls')),
    path('', include('apps.pacientes.pacientes.urls')),
    path('', include('apps.atencionClinica.especialistas.urls')),
    path('', include('apps.pacientes.historial_clinico.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.atencionClinica.antecedentes.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.atencionClinica.diagnosticos.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.atencionClinica.tratamientos.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.atencionClinica.evoluciones.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.atencionClinica.recetas.urls')),
    path('', include('apps.atencionClinica.citas.urls')),
    path('consultas/', include('apps.atencionClinica.consultas.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include((api_patterns, 'api'))),
]

# Media y static en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

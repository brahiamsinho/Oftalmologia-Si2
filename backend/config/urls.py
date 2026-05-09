from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


api_patterns = [
    path('', include('apps.core.urls')),
    path('', include('apps.tenant.urls')),

    path('', include('apps.usuarios.users.urls')),
    path('', include('apps.usuarios.roles.urls')),
    path('', include('apps.usuarios.permisos.urls')),
    path('', include('apps.bitacora.urls')),
    path('', include('apps.pacientes.pacientes.urls')),
    path('', include('apps.pacientes.historial_clinico.urls')),
    path('', include('apps.atencionClinica.especialistas.urls')),
    path('', include('apps.atencionClinica.citas.urls')),
    path('', include('apps.atencionClinica.evaluacion_quirurgica.urls')),
    path('', include('apps.atencionClinica.preoperatorio.urls')),
    path('', include('apps.atencionClinica.cirugias.urls')),
    path('', include('apps.atencionClinica.postoperatorio.urls')),
    path('', include('apps.crm.urls')),
    path('historias-clinicas/<int:id_historia_clinica>/', include('apps.atencionClinica.antecedentes.urls')),
    path('consultas/', include('apps.atencionClinica.consultas.urls')),
    path('medicion-visual/', include('apps.atencionClinica.medicion_visual.urls')),
    path('notificaciones/', include('apps.notificaciones.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include((api_patterns, 'api'))),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.authentication import PlatformJWTAuthentication
from apps.core.permissions import IsAdministrativoOrAdmin, IsPlatformAdministrator

from .models import SubscriptionPlan, Tenant, TenantSettings
from .serializers import (
    SubscriptionPlanSerializer,
    TenantChangePlanSerializer,
    TenantCreateSerializer,
    TenantManagementSerializer,
    TenantPublicSerializer,
    TenantSettingsSerializer,
    TenantSettingsUpdateSerializer,
)


def _tenant_es_invalido_para_organizacion(tenant):
    return tenant is None or getattr(tenant, 'schema_name', None) == 'public'


def _tenant_organization_error():
    return Response(
        {
            'detail': (
                'Este endpoint debe usarse dentro de una organización. '
                'Ejemplo: /t/clinica-demo/api/organization/settings/'
            )
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def _get_or_create_settings(tenant):
    settings_obj, _created = TenantSettings.objects.get_or_create(
        tenant=tenant,
        defaults={
            'branding_nombre': tenant.nombre,
        },
    )
    return settings_obj


def _reload_tenant(tenant):
    return (
        Tenant.objects
        .select_related('settings', 'subscription__plan', 'usage')
        .get(pk=tenant.pk)
    )


class TenantCurrentView(APIView):
    """
    GET /t/<slug>/api/organization/me/

    Devuelve la organización actual resuelta por django-tenants.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)

        if tenant is None:
            return Response(
                {'detail': 'Tenant no resuelto.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        tenant = _reload_tenant(tenant)

        return Response(
            TenantPublicSerializer(
                tenant,
                context={'request': request},
            ).data,
        )


class TenantSettingsCurrentView(APIView):
    """
    GET   /t/<slug>/api/organization/settings/
    PATCH /t/<slug>/api/organization/settings/
    PUT   /t/<slug>/api/organization/settings/

    Permite que un ADMIN o ADMINISTRATIVO de una clínica modifique la
    configuración visual y funcional de su propia organización.
    """
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)

        if _tenant_es_invalido_para_organizacion(tenant):
            return _tenant_organization_error()

        settings_obj = _get_or_create_settings(tenant)
        tenant = _reload_tenant(tenant)

        return Response(
            {
                'settings': TenantSettingsSerializer(settings_obj).data,
                'tenant': TenantPublicSerializer(
                    tenant,
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        tenant = getattr(request, 'tenant', None)

        if _tenant_es_invalido_para_organizacion(tenant):
            return _tenant_organization_error()

        settings_obj = _get_or_create_settings(tenant)

        serializer = TenantSettingsUpdateSerializer(
            settings_obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        tenant = _reload_tenant(tenant)
        settings_obj = tenant.settings

        return Response(
            {
                'mensaje': 'Configuración de organización actualizada correctamente.',
                'settings': TenantSettingsSerializer(settings_obj).data,
                'tenant': TenantPublicSerializer(
                    tenant,
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        tenant = getattr(request, 'tenant', None)

        if _tenant_es_invalido_para_organizacion(tenant):
            return _tenant_organization_error()

        settings_obj = _get_or_create_settings(tenant)

        serializer = TenantSettingsUpdateSerializer(
            settings_obj,
            data=request.data,
            partial=False,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        tenant = _reload_tenant(tenant)
        settings_obj = tenant.settings

        return Response(
            {
                'mensaje': 'Configuración de organización reemplazada correctamente.',
                'settings': TenantSettingsSerializer(settings_obj).data,
                'tenant': TenantPublicSerializer(
                    tenant,
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class TenantChangePlanView(APIView):
    """
    POST /t/<slug>/api/organization/change-plan/

    Cambia el plan de la organización actual.
    Requiere usuario autenticado ADMIN o ADMINISTRATIVO dentro del tenant.
    """
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)

        if _tenant_es_invalido_para_organizacion(tenant):
            return Response(
                {
                    'detail': (
                        'Este endpoint debe usarse dentro de una organización. '
                        'Ejemplo: /t/clinica-demo/api/organization/change-plan/'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TenantChangePlanSerializer(
            data=request.data,
            context={
                'request': request,
                'tenant': tenant,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        tenant_actualizado = _reload_tenant(tenant)

        return Response(
            TenantManagementSerializer(
                tenant_actualizado,
                context={'request': request},
            ).data,
            status=status.HTTP_200_OK,
        )


class PublicTenantLookupView(APIView):
    """
    GET /api/tenants/<slug>/

    Búsqueda pública de una organización por slug.
    Sirve para que el frontend pueda buscar la clínica antes de entrar al scope /t/<slug>/.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        tenant = (
            Tenant.objects
            .select_related('settings', 'subscription__plan', 'usage')
            .filter(slug=slug, activo=True)
            .first()
        )

        if tenant is None:
            return Response(
                {'detail': 'Organización no encontrada o inactiva.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            TenantPublicSerializer(
                tenant,
                context={'request': request},
            ).data,
        )


class SubscriptionPlanViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Catálogo público de planes (AllowAny).

    Sin authentication_classes explícitas, DRF usaría TenantScopedJWTAuthentication;
    si el cliente envía Bearer de plataforma (p. ej. panel /platform/dashboard),
    ese backend rechaza token_scope=platform → 401 y el frontend cerraba sesión.
    """

    queryset = SubscriptionPlan.objects.filter(activo=True).order_by(
        'precio_mensual',
        'codigo',
    )
    serializer_class = SubscriptionPlanSerializer
    authentication_classes = []
    permission_classes = [AllowAny]


class TenantManagementViewSet(viewsets.ModelViewSet):
    """
    Administración central de tenants.

    Este ViewSet es para el superadmin del sistema, no para el admin normal de una clínica.
    """
    queryset = Tenant.objects.select_related(
        'settings',
        'subscription__plan',
        'usage',
    ).all()
    authentication_classes = [PlatformJWTAuthentication]
    permission_classes = [IsAuthenticated, IsPlatformAdministrator]

    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        return TenantManagementSerializer

    def create(self, request, *args, **kwargs):
        serializer = TenantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.save()

        tenant = _reload_tenant(tenant)

        return Response(
            TenantManagementSerializer(
                tenant,
                context={'request': request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        tenant = self.get_object()
        tenant.activo = True
        tenant.save(update_fields=['activo', 'updated_at'])

        tenant = _reload_tenant(tenant)

        return Response(
            TenantManagementSerializer(
                tenant,
                context={'request': request},
            ).data,
        )

    @action(detail=True, methods=['post'], url_path='suspender')
    def suspender(self, request, pk=None):
        tenant = self.get_object()
        tenant.activo = False
        tenant.save(update_fields=['activo', 'updated_at'])

        tenant = _reload_tenant(tenant)

        return Response(
            TenantManagementSerializer(
                tenant,
                context={'request': request},
            ).data,
        )

    @action(detail=True, methods=['post'], url_path='cambiar-plan')
    def cambiar_plan(self, request, pk=None):
        """
        POST /api/tenants/{id}/cambiar-plan/

        Endpoint para superadmin del sistema.
        Permite cambiar el plan de cualquier tenant desde administración central.
        """
        tenant = self.get_object()

        serializer = TenantChangePlanSerializer(
            data=request.data,
            context={
                'request': request,
                'tenant': tenant,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        tenant_actualizado = _reload_tenant(tenant)

        return Response(
            TenantManagementSerializer(
                tenant_actualizado,
                context={'request': request},
            ).data,
            status=status.HTTP_200_OK,
        )
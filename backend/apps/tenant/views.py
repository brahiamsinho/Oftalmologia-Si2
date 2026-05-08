from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdministrativoOrAdmin

from .models import SubscriptionPlan, Tenant
from .serializers import (
    SubscriptionPlanSerializer,
    TenantChangePlanSerializer,
    TenantCreateSerializer,
    TenantManagementSerializer,
    TenantPublicSerializer,
)


class TenantCurrentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return Response({'detail': 'Tenant no resuelto.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TenantPublicSerializer(tenant).data)


class TenantChangePlanView(APIView):
    """
    POST /t/<slug>/api/organization/change-plan/

    Cambia el plan de la organización actual.
    Requiere usuario autenticado ADMIN o ADMINISTRATIVO dentro del tenant.
    """

    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)

        if tenant is None or getattr(tenant, 'schema_name', None) == 'public':
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

        tenant_actualizado = (
            Tenant.objects
            .select_related('settings', 'subscription__plan', 'usage')
            .get(pk=tenant.pk)
        )

        return Response(TenantManagementSerializer(tenant_actualizado).data, status=status.HTTP_200_OK)


class PublicTenantLookupView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        tenant = (
            Tenant.objects.select_related('settings', 'subscription__plan', 'usage')
            .filter(slug=slug, activo=True)
            .first()
        )
        if tenant is None:
            return Response({'detail': 'Organización no encontrada o inactiva.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TenantPublicSerializer(tenant).data)


class SubscriptionPlanViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = SubscriptionPlan.objects.filter(activo=True).order_by('precio_mensual', 'codigo')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]


class TenantManagementViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.select_related('settings', 'subscription__plan', 'usage').all()
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        return TenantManagementSerializer

    def create(self, request, *args, **kwargs):
        serializer = TenantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.save()
        return Response(TenantManagementSerializer(tenant).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        tenant = self.get_object()
        tenant.activo = True
        tenant.save(update_fields=['activo', 'updated_at'])
        return Response(TenantManagementSerializer(tenant).data)

    @action(detail=True, methods=['post'], url_path='suspender')
    def suspender(self, request, pk=None):
        tenant = self.get_object()
        tenant.activo = False
        tenant.save(update_fields=['activo', 'updated_at'])
        return Response(TenantManagementSerializer(tenant).data)

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

        tenant_actualizado = (
            Tenant.objects
            .select_related('settings', 'subscription__plan', 'usage')
            .get(pk=tenant.pk)
        )

        return Response(TenantManagementSerializer(tenant_actualizado).data, status=status.HTTP_200_OK)
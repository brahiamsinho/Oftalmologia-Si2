from decimal import Decimal

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.authentication import PlatformJWTAuthentication
from apps.core.permissions import IsAdministrativoOrAdmin, IsPlatformAdministrator

from .models import EstadoSuscripcion, SubscriptionPlan, Tenant, TenantSettings, TenantSubscription
from .serializers import (
    SubscriptionPlanSerializer,
    TenantChangePlanSerializer,
    TenantCreateSerializer,
    TenantManagementSerializer,
    TenantPublicSerializer,
    TenantStripeCheckoutSerializer,
    TenantStripeConfirmSerializer,
    TenantSettingsSerializer,
    TenantSettingsUpdateSerializer,
)

try:
    import stripe
except Exception:  # pragma: no cover - entorno sin dependencia instalada aún
    stripe = None


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


def _require_stripe():
    if stripe is None:
        raise ValidationError('La dependencia stripe no está instalada en el backend.')
    if not settings.STRIPE_SECRET_KEY:
        raise ValidationError('STRIPE_SECRET_KEY no está configurada.')
    stripe.api_key = settings.STRIPE_SECRET_KEY


def _stripe_exception_to_response(exc):
    """
    Traduce excepciones Stripe a respuesta HTTP controlada (sin 500).
    """
    if stripe is not None and isinstance(exc, stripe.error.AuthenticationError):
        return Response(
            {
                'detail': (
                    'Stripe rechazó la API key configurada. '
                    'Verifica STRIPE_SECRET_KEY y reinicia el backend.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    if stripe is not None and isinstance(exc, stripe.error.StripeError):
        return Response(
            {'detail': f'Error de Stripe: {str(exc)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(
        {'detail': 'No se pudo iniciar el checkout de pago. Intenta nuevamente.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _apply_paid_plan_change(tenant, plan_codigo, session_id):
    try:
        plan = SubscriptionPlan.objects.get(codigo=plan_codigo, activo=True)
    except SubscriptionPlan.DoesNotExist as exc:
        raise ValidationError('El plan pagado no existe o está inactivo.') from exc

    suscripcion, _created = TenantSubscription.objects.get_or_create(
        tenant=tenant,
        defaults={
            'plan': plan,
            'estado': EstadoSuscripcion.ACTIVA,
            'fecha_inicio': timezone.now(),
        },
    )
    suscripcion.plan = plan
    suscripcion.estado = EstadoSuscripcion.ACTIVA
    suscripcion.trial_fin = None
    suscripcion.fecha_inicio = timezone.now()
    suscripcion.proveedor_pago = 'stripe'
    suscripcion.referencia_pago = session_id
    suscripcion.notas = f'Checkout Stripe confirmado: {session_id}'
    suscripcion.save()
    return suscripcion


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


class TenantStripeCheckoutView(APIView):
    """
    POST /t/<slug>/api/organization/change-plan/checkout/

    Crea una sesión de Stripe Checkout para upgrades de plan.
    """
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)
        if _tenant_es_invalido_para_organizacion(tenant):
            return _tenant_organization_error()

        serializer = TenantStripeCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan_codigo = serializer.validated_data['plan']

        try:
            plan = SubscriptionPlan.objects.get(codigo=plan_codigo, activo=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'detail': 'El plan indicado no existe o está inactivo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Decimal(plan.precio_mensual) <= Decimal('0'):
            return Response(
                {'detail': 'Para planes gratuitos usa change-plan directo (sin pasarela).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _require_stripe()

        success_url = (
            f"{settings.FRONTEND_URL}/planes"
            "?checkout=success&session_id={CHECKOUT_SESSION_ID}"
        )
        cancel_url = f"{settings.FRONTEND_URL}/planes?checkout=cancel"

        try:
            session = stripe.checkout.Session.create(
                mode='payment',
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': settings.STRIPE_CURRENCY,
                            'product_data': {
                                'name': f'Plan {plan.nombre} ({plan.codigo})',
                                'description': f'Upgrade de plan para {tenant.nombre}',
                            },
                            'unit_amount': int(Decimal(plan.precio_mensual) * 100),
                        },
                        'quantity': 1,
                    }
                ],
                metadata={
                    'tenant_id': str(tenant.pk),
                    'tenant_slug': tenant.slug,
                    'plan_codigo': plan.codigo,
                    'user_id': str(request.user.pk),
                },
                success_url=success_url,
                cancel_url=cancel_url,
            )
        except Exception as exc:
            return _stripe_exception_to_response(exc)

        return Response(
            {
                'checkout_url': session.url,
                'session_id': session.id,
            },
            status=status.HTTP_200_OK,
        )


class TenantStripeConfirmView(APIView):
    """
    POST /t/<slug>/api/organization/change-plan/confirm-stripe/

    Confirma sesión de Stripe y aplica cambio de plan.
    """
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)
        if _tenant_es_invalido_para_organizacion(tenant):
            return _tenant_organization_error()

        serializer = TenantStripeConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_id = serializer.validated_data['session_id']

        _require_stripe()
        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except Exception as exc:
            return _stripe_exception_to_response(exc)

        metadata = session.get('metadata') or {}
        plan_codigo = metadata.get('plan_codigo')
        tenant_id = metadata.get('tenant_id')

        if str(tenant.pk) != str(tenant_id):
            return Response(
                {'detail': 'La sesión de pago no corresponde a esta organización.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if session.get('payment_status') != 'paid':
            return Response(
                {'detail': 'La sesión Stripe todavía no está pagada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _apply_paid_plan_change(tenant, plan_codigo, session_id)
        tenant_actualizado = _reload_tenant(tenant)
        return Response(
            TenantManagementSerializer(tenant_actualizado, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )


class StripeWebhookPublicView(APIView):
    """
    POST /api/public/stripe/webhook/

    Webhook opcional para confirmar eventos Stripe del lado servidor.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        _require_stripe()

        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        if settings.STRIPE_WEBHOOK_SECRET:
            try:
                event = stripe.Webhook.construct_event(
                    payload=payload,
                    sig_header=sig_header,
                    secret=settings.STRIPE_WEBHOOK_SECRET,
                )
            except stripe.error.SignatureVerificationError:
                return HttpResponse(status=400)
            except Exception:
                return HttpResponse(status=400)
        else:
            # Solo para entornos dev si no hay webhook secret configurado.
            event = request.data

        if event.get('type') == 'checkout.session.completed':
            session = event['data']['object']
            metadata = session.get('metadata') or {}
            tenant_id = metadata.get('tenant_id')
            plan_codigo = metadata.get('plan_codigo')
            session_id = session.get('id')
            if tenant_id and plan_codigo and session_id:
                tenant = Tenant.objects.filter(pk=tenant_id).first()
                if tenant and tenant.schema_name != 'public':
                    _apply_paid_plan_change(tenant, plan_codigo, session_id)

        return HttpResponse(status=200)


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
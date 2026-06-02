from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import CobroClinico, EstadoCobro, MetodoPagoClinico

from apps.atencionClinica.especialistas.models import Especialista
from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin, IsPaciente
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.pacientes.pacientes.models import Paciente

from .models import CatalogoServicioClinico, FacturaClinica
from .permissions import EsPropietarioFacturaPaciente, PasarelaWebhookPermission
from .serializers import (
    AnularFacturaSerializer,
    CatalogoServicioClinicoSerializer,
    CobroClinicoSerializer,
    ConfirmarPasarelaSerializer,
    EmitirFacturaSerializer,
    FacturaClinicaSerializer,
    PreviewFacturaSerializer,
    RegistrarCobroSerializer,
)
from .services import (
    confirmar_pago_pasarela,
    generar_comprobante_pdf,
    generar_comprobante_texto,
    generar_qr_pago,
    iniciar_pago_en_linea,
    listar_facturas_paciente,
)


class FacturacionBitacoraMixin:
    modulo_bitacora = 'facturacion'
    tabla_bitacora = ''
    id_field_name = 'id'

    def _id_value(self, instance):
        return getattr(instance, self.id_field_name)

    def _registrar(self, accion: str, descripcion: str, instance):
        registrar_bitacora(
            usuario=self.request.user,
            modulo=self.modulo_bitacora,
            accion=accion,
            descripcion=descripcion,
            tabla_afectada=self.tabla_bitacora,
            id_registro_afectado=self._id_value(instance),
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )


class CatalogoServicioClinicoViewSet(FacturacionBitacoraMixin, viewsets.ModelViewSet):
    queryset = CatalogoServicioClinico.objects.select_related('id_tipo_cita').all()
    serializer_class = CatalogoServicioClinicoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'tipo_servicio', 'id_tipo_cita']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'precio_base', 'tipo_servicio']
    ordering = ['tipo_servicio', 'nombre']
    tabla_bitacora = 'facturacion_catalogo_servicios'
    id_field_name = 'id_servicio'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]


class FacturaClinicaViewSet(FacturacionBitacoraMixin, viewsets.ModelViewSet):
    queryset = FacturaClinica.objects.select_related(
        'id_paciente',
        'id_servicio',
        'id_cita',
        'id_promocion_aplicada',
        'creado_por',
    ).prefetch_related('cobros').all()
    serializer_class = FacturaClinicaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'id_paciente', 'id_cita', 'id_servicio']
    search_fields = [
        'numero_factura',
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'id_paciente__numero_documento',
    ]
    ordering_fields = ['fecha_emision', 'monto_total', 'saldo_pendiente', 'created_at']
    ordering = ['-fecha_emision']
    tabla_bitacora = 'facturacion_facturas'
    id_field_name = 'id_factura'

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return FacturaClinica.objects.none()

        tipo = getattr(user, 'tipo_usuario', '') or ''
        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return FacturaClinica.objects.none()
            return qs.filter(id_paciente=paciente)
        if tipo in ('MEDICO', 'ESPECIALISTA'):
            especialista = Especialista.objects.filter(usuario=user).first()
            if not especialista:
                return FacturaClinica.objects.none()
            return qs.filter(id_cita__id_especialista=especialista)
        if tipo in ('ADMIN', 'ADMINISTRATIVO'):
            return qs
        return FacturaClinica.objects.none()

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'emitir', 'anular'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        if self.action in ('registrar_cobro',):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        if self.action in ('iniciar_pago_en_linea', 'confirmar_pago_mock_action'):
            return [IsAuthenticated(), EsPropietarioFacturaPaciente()]
        if self.action in ('mis_pendientes',):
            return [IsAuthenticated(), IsPaciente()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'preview':
            return PreviewFacturaSerializer
        if self.action == 'emitir':
            return EmitirFacturaSerializer
        if self.action == 'registrar_cobro':
            return RegistrarCobroSerializer
        if self.action == 'anular':
            return AnularFacturaSerializer
        return FacturaClinicaSerializer

    def create(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Use POST /facturacion/facturas/emitir/ para generar una factura con cálculo automático.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def update(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Las facturas emitidas no se editan; anule y vuelva a emitir si es necesario.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Use POST /facturacion/facturas/{id}/anular/ en lugar de eliminar.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, methods=['post'], url_path='preview')
    def preview(self, request):
        ser = PreviewFacturaSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return Response(ser.validated_data['resultado'], status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='emitir')
    def emitir(self, request):
        ser = EmitirFacturaSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        factura = ser.save()
        self._registrar(
            AccionBitacora.CREAR,
            f'Emitió factura {factura.numero_factura} por {factura.monto_total}',
            factura,
        )
        return Response(
            FacturaClinicaSerializer(factura).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='mis-pendientes')
    def mis_pendientes(self, request):
        """Paciente autenticado: facturas con saldo pendiente."""
        paciente = Paciente.objects.filter(usuario=request.user).first()
        if not paciente:
            return Response({'facturas': [], 'total': 0})
        facturas = listar_facturas_paciente(paciente.pk, solo_pendientes=True)
        return Response({'facturas': facturas, 'total': len(facturas)})

    @action(detail=True, methods=['post'], url_path='registrar-cobro')
    def registrar_cobro(self, request, pk=None):
        factura = self.get_object()
        ser = RegistrarCobroSerializer(
            data=request.data,
            context={'factura': factura, 'request': request},
        )
        ser.is_valid(raise_exception=True)
        cobro = ser.save()
        self._registrar(
            AccionBitacora.EDITAR,
            f'Registró cobro #{cobro.pk} de {cobro.monto} en factura {factura.numero_factura}',
            factura,
        )
        factura.refresh_from_db()
        return Response(
            {
                'cobro': CobroClinicoSerializer(cobro).data,
                'factura': FacturaClinicaSerializer(factura).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=['post'],
        url_path='generar-qr',
        permission_classes=[IsAuthenticated, IsAdministrativoOrAdmin],
    )
    def generar_qr(self, request, pk=None):
        """
        POST /api/facturacion/facturas/{id}/generar-qr/

        Genera un código QR de pago para la factura.
        Devuelve la imagen PNG en base64 y la referencia para confirmar después.

        Flujo:
          1. Llamar este endpoint → obtener qr_base64 + referencia_pasarela
          2. Mostrar QR al paciente para que escanee y pague
          3. Confirmar con POST /cobros/confirmar-pasarela/ {referencia, exito: true}
        """
        from django.core.exceptions import ValidationError as DjangoValidationError  # noqa: PLC0415
        from rest_framework.exceptions import ValidationError as DRFValidationError   # noqa: PLC0415

        factura = self.get_object()
        try:
            resultado = generar_qr_pago(factura)
        except DjangoValidationError as exc:
            raise DRFValidationError({'detail': exc.message}) from exc

        self._registrar(
            AccionBitacora.EDITAR,
            f'Generó QR de pago para factura {factura.numero_factura} monto {resultado["monto"]}',
            factura,
        )
        return Response(resultado, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='iniciar-pago-en-linea')
    def iniciar_pago_en_linea_action(self, request, pk=None):
        factura = self.get_object()
        tenant_slug = getattr(getattr(request, 'tenant', None), 'slug', None)
        resultado = iniciar_pago_en_linea(factura, tenant_slug=tenant_slug)
        checkout_url = resultado.get('checkout_url')
        if tenant_slug and isinstance(checkout_url, str) and checkout_url.startswith('/api/'):
            # En esquema tenant las rutas públicas van bajo /t/<slug>/api/...
            resultado['checkout_url'] = f'/t/{tenant_slug}{checkout_url}'
        self._registrar(
            AccionBitacora.EDITAR,
            f'Inició pago en línea factura {factura.numero_factura}',
            factura,
        )
        return Response(resultado, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='confirmar-pago-mock')
    def confirmar_pago_mock_action(self, request, pk=None):
        """
        Flujo demo mobile/web: confirma el último cobro EN_LINEA pendiente de la factura.
        Evita exponer el webhook técnico `confirmar-pasarela` al paciente.
        """
        factura = self.get_object()
        cobro = factura.cobros.filter(
            estado=EstadoCobro.PENDIENTE,
            metodo_pago=MetodoPagoClinico.EN_LINEA,
        ).order_by('-created_at').first()
        if not cobro:
            return Response(
                {'detail': 'No hay un intento de pago en línea pendiente para esta factura.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cobro_confirmado = confirmar_pago_pasarela(cobro.referencia_pasarela, exito=True)
        factura.refresh_from_db()
        self._registrar(
            AccionBitacora.EDITAR,
            f'Confirmó pago mock factura {factura.numero_factura}',
            factura,
        )
        return Response(
            {
                'cobro': CobroClinicoSerializer(cobro_confirmado).data,
                'factura': FacturaClinicaSerializer(factura).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='comprobante')
    def comprobante(self, request, pk=None):
        factura = self.get_object()
        if request.query_params.get('formato') == 'texto':
            return Response({'texto': generar_comprobante_texto(factura)})
        try:
            pdf_bytes = generar_comprobante_pdf(factura)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            filename = f'{factura.numero_factura or "factura"}.pdf'
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        except RuntimeError:
            texto = generar_comprobante_texto(factura)
            return HttpResponse(texto, content_type='text/plain; charset=utf-8')

    @action(detail=True, methods=['post'], url_path='anular')
    def anular(self, request, pk=None):
        factura = self.get_object()
        ser = AnularFacturaSerializer(data={}, context={'factura': factura})
        ser.is_valid(raise_exception=True)
        factura = ser.save()
        self._registrar(
            AccionBitacora.EDITAR,
            f'Anuló factura {factura.numero_factura}',
            factura,
        )
        return Response(FacturaClinicaSerializer(factura).data)


class CobroClinicoViewSet(FacturacionBitacoraMixin, viewsets.ReadOnlyModelViewSet):
    queryset = CobroClinico.objects.select_related('id_factura', 'registrado_por').all()
    serializer_class = CobroClinicoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'metodo_pago', 'id_factura']
    search_fields = ['referencia_pasarela', 'id_factura__numero_factura']
    ordering_fields = ['fecha_cobro', 'monto']
    ordering = ['-fecha_cobro']
    tabla_bitacora = 'facturacion_cobros'
    id_field_name = 'id_cobro'

    def get_permissions(self):
        if self.action == 'confirmar_pasarela':
            return [PasarelaWebhookPermission()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='confirmar-pasarela')
    def confirmar_pasarela(self, request):
        """
        Webhook simulado CU20.
        Header: X-Pasarela-Secret (o usuario administrativo).
        Body: { "referencia_pasarela": "uuid", "exito": true }
        """
        ser = ConfirmarPasarelaSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cobro = ser.save()
        factura = cobro.id_factura
        self._registrar(
            AccionBitacora.EDITAR,
            f'Pasarela {cobro.estado} cobro #{cobro.pk} factura {factura.numero_factura}',
            cobro,
        )
        factura.refresh_from_db()
        return Response(
            {
                'cobro': CobroClinicoSerializer(cobro).data,
                'factura': FacturaClinicaSerializer(factura).data,
            },
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def mock_checkout_pasarela(request, referencia: str):
    """
    CU20 — Pantalla mock de pasarela (solo desarrollo).
    La confirmación real del pago es POST /facturacion/cobros/confirmar-pasarela/
    """
    cobro = CobroClinico.objects.filter(
        referencia_pasarela=referencia,
        metodo_pago=MetodoPagoClinico.EN_LINEA,
        estado=EstadoCobro.PENDIENTE,
    ).select_related('id_factura').first()

    if not cobro:
        return Response(
            {'detail': 'Referencia no encontrada o pago ya procesado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            'referencia_pasarela': referencia,
            'monto': str(cobro.monto),
            'factura': cobro.id_factura.numero_factura,
            'confirmar': {
                'metodo': 'POST',
                'url': '/api/facturacion/cobros/confirmar-pasarela/',
                'body': {'referencia_pasarela': referencia, 'exito': True},
                'header': 'X-Pasarela-Secret: <PASARELA_MOCK_SECRET>',
            },
        },
    )

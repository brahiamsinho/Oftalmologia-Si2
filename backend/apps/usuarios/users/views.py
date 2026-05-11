"""
apps/users/views.py
Vistas exclusivas del dominio de Usuarios y Autenticación.

Roles → apps/roles/views.py
Permisos → apps/permisos/views.py

Auth endpoints:
  POST  /api/auth/register/
  POST  /api/auth/login/
  POST  /api/auth/logout/
  GET   /api/auth/me/
  PATCH /api/auth/me/
  GET   /api/auth/tenant/
  POST  /api/auth/change-password/
  POST  /api/auth/reset-password/
  POST  /api/auth/reset-password/confirm/

Users CRUD:
  /api/users/
  /api/users/{id}/activar/
  /api/users/{id}/bloquear/
  GET/POST /api/users/{id}/roles/
"""
import logging

from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.bitacora.models import AccionBitacora
from apps.core.authentication import TOKEN_SCOPE_TENANT
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.notificaciones.services import enviar_push_a_usuario, registrar_dispositivo_fcm
from apps.tenant.serializers import TenantPublicSerializer

from .emails import enviar_confirmacion_registro, enviar_recuperacion_password
from .models import TipoUsuario, Usuario
from .serializers import (
    CambiarPasswordSerializer,
    ConfirmarPasswordSerializer,
    LoginSerializer,
    PerfilSerializer,
    RecuperarPasswordSerializer,
    RegistroSerializer,
    UsuarioCreateSerializer,
    UsuarioSerializer,
)
from .tokens import crear_token_recuperacion, validar_token_recuperacion

logger = logging.getLogger('apps')


def _public_tenant_payload(schema_name='public'):
    return {
        'id': None,
        'id_tenant': None,
        'schema_name': schema_name,
        'slug': None,
        'nombre': 'Sistema',
        'razon_social': '',
        'nit': '',
        'email_contacto': '',
        'telefono_contacto': '',
        'activo': True,
        'dominio_base': None,
        'dominio': None,
        'is_public': True,
        'url_prefix': '/',
        'branding': {
            'nombre': 'Sistema',
            'logo_url': None,
            'color_primario': '#2563eb',
            'color_secundario': '#0f172a',
        },
        'config': {},
        'settings': None,
        'subscription': None,
    }


def _tenant_payload(request):
    """
    Devuelve información pública del tenant actual.

    Para el flujo frontend:
      1. GET  /t/<slug>/api/auth/tenant/
      2. POST /t/<slug>/api/auth/login/
      3. Frontend usa tenant.branding/config para pintar la UI.
    """
    tenant = getattr(request, 'tenant', None)

    schema_name = getattr(
        tenant,
        'schema_name',
        getattr(connection, 'schema_name', settings.PUBLIC_SCHEMA_NAME),
    )

    public_schema_name = getattr(settings, 'PUBLIC_SCHEMA_NAME', 'public')
    is_public = schema_name == public_schema_name

    if tenant is None or is_public:
        return _public_tenant_payload(schema_name=schema_name)

    return TenantPublicSerializer(
        tenant,
        context={'request': request},
    ).data


def _jwt_response(usuario, request=None):
    """
    Genera respuesta estándar con tokens JWT + datos del usuario + tenant actual.
    """
    refresh = RefreshToken.for_user(usuario)
    refresh['token_scope'] = TOKEN_SCOPE_TENANT

    tenant_data = _tenant_payload(request) if request is not None else None

    if tenant_data and not tenant_data.get('is_public'):
        refresh['tenant_id'] = tenant_data.get('id')
        refresh['tenant_schema'] = tenant_data.get('schema_name')
        refresh['tenant_slug'] = tenant_data.get('slug')

    access = refresh.access_token
    access['token_scope'] = TOKEN_SCOPE_TENANT

    return {
        'usuario': UsuarioSerializer(usuario).data,
        'tenant': tenant_data,
        'access': str(access),
        'refresh': str(refresh),
    }


class TenantActualView(APIView):
    """
    GET /api/auth/tenant/

    Devuelve la configuración pública del tenant actual.
    Útil antes del login para pintar logo, colores y nombre de la organización.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({
            'tenant': _tenant_payload(request),
        })


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Registro público. Crea Paciente automáticamente.
    Opcional push: "fcm_token", "plataforma" (android|ios|web).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = (
            request.data.copy()
            if hasattr(request.data, 'copy')
            else dict(request.data)
        )

        fcm_token = payload.pop('fcm_token', None) or payload.pop('fcmToken', None)
        fcm_plataforma = payload.pop('plataforma', None)

        payload['tipo_usuario'] = TipoUsuario.PACIENTE

        serializer = RegistroSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        extra = getattr(usuario, '_extra_registro', {})
        self._crear_perfil(usuario, extra)

        email_ok = enviar_confirmacion_registro(usuario)

        registrar_bitacora(
            usuario=usuario,
            modulo='auth',
            accion=AccionBitacora.CREAR,
            descripcion=f'Nuevo registro: {usuario.username} ({usuario.tipo_usuario})',
            tabla_afectada='usuarios',
            id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        registrar_dispositivo_fcm(usuario, fcm_token, fcm_plataforma)

        enviar_push_a_usuario(
            usuario_id=usuario.id,
            titulo='¡Bienvenido/a!',
            cuerpo=f'Hola {usuario.nombres}, tu cuenta fue creada exitosamente.',
            data={'tipo': 'registro'},
            tipo='registro',
        )

        if not fcm_token:
            logger.info(
                '[register] Sin FCM token en el request → push solo en BD (usuario_id=%s)',
                usuario.id,
            )

        payload = _jwt_response(usuario, request=request)
        payload['email_confirmacion_enviada'] = email_ok

        return Response(payload, status=status.HTTP_201_CREATED)

    def _crear_perfil(self, usuario, extra):
        if usuario.tipo_usuario == 'PACIENTE':
            try:
                from apps.pacientes.pacientes.models import Paciente
                from apps.pacientes.pacientes.utils import generar_numero_historia

                num_doc = extra.get('numero_documento') or f'PENDIENTE-{usuario.id}'

                Paciente.objects.create(
                    usuario=usuario,
                    numero_historia=generar_numero_historia(),
                    tipo_documento=extra.get('tipo_documento', 'DNI'),
                    numero_documento=num_doc,
                    nombres=usuario.nombres,
                    apellidos=usuario.apellidos,
                    telefono=usuario.telefono,
                    email=usuario.email,
                )
            except Exception as exc:
                logger.error('[register] Error creando Paciente: %s', exc)

        elif usuario.tipo_usuario in ('MEDICO', 'ESPECIALISTA'):
            try:
                from apps.atencionClinica.especialistas.models import Especialista

                Especialista.objects.create(
                    usuario=usuario,
                    especialidad=extra.get('especialidad', 'General'),
                    codigo_profesional=extra.get('codigo_profesional') or None,
                )
            except Exception as exc:
                logger.error('[register] Error creando Especialista: %s', exc)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "..." }
    Opcional push: "fcm_token", "plataforma" (android|ios|web).

    Debe llamarse desde:
      /t/<slug>/api/auth/login/

    Así django-tenants ya habrá cambiado al schema correcto.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data_in = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        fcm_token = data_in.pop('fcm_token', None) or data_in.pop('fcmToken', None)
        fcm_plataforma = data_in.pop('plataforma', None)

        serializer = LoginSerializer(data=data_in)
        serializer.is_valid(raise_exception=True)

        usuario = serializer.validated_data['user']

        usuario.ultimo_acceso = timezone.now()
        usuario.save(update_fields=['ultimo_acceso'])

        registrar_bitacora(
            usuario=usuario,
            modulo='auth',
            accion=AccionBitacora.LOGIN,
            descripcion=f'Login exitoso: {usuario.username}',
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        registrar_dispositivo_fcm(usuario, fcm_token, fcm_plataforma)

        enviar_push_a_usuario(
            usuario_id=usuario.id,
            titulo='Sesión iniciada',
            cuerpo=f'Hola {usuario.nombres}, accediste correctamente a tu cuenta.',
            data={'tipo': 'login'},
            tipo='login',
        )

        if not fcm_token:
            logger.info(
                '[login] Sin FCM token en el request → push solo en BD (usuario_id=%s)',
                usuario.id,
            )

        return Response(_jwt_response(usuario, request=request))


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: { "refresh": "<refresh_token>" }
    Añade el refresh token a la JWT Blacklist.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'error': 'Se requiere el refresh token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {'error': 'Token inválido o ya expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        registrar_bitacora(
            usuario=request.user,
            modulo='auth',
            accion=AccionBitacora.LOGOUT,
            descripcion=f'Logout: {request.user.username}',
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({'mensaje': 'Sesión cerrada correctamente.'})


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/
    PATCH /api/auth/me/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PerfilSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        usuario = self.get_object()
        data = self.get_serializer(usuario).data
        data['tenant'] = _tenant_payload(request)
        return Response(data)

    def perform_update(self, serializer):
        serializer.save()

        registrar_bitacora(
            usuario=self.request.user,
            modulo='auth',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Perfil actualizado: {self.request.user.username}',
            tabla_afectada='usuarios',
            id_registro_afectado=self.request.user.id,
            ip_origen=get_client_ip(self.request),
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['password_actual']):
            return Response(
                {'error': 'La contraseña actual es incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(serializer.validated_data['password_nuevo'])
        request.user.save(update_fields=['password'])

        registrar_bitacora(
            usuario=request.user,
            modulo='auth',
            accion=AccionBitacora.CAMBIAR_PASSWORD,
            descripcion=f'Cambio de contraseña: {request.user.username}',
            ip_origen=get_client_ip(request),
        )

        return Response({'mensaje': 'Contraseña actualizada correctamente.'})


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Envía email con token de reset. Siempre responde 200 para no revelar si existe.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecuperarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            usuario = Usuario.objects.get(email=email, estado='ACTIVO')
            token_obj = crear_token_recuperacion(usuario)
            enviar_recuperacion_password(usuario, token_obj.token)

            registrar_bitacora(
                usuario=usuario,
                modulo='auth',
                accion=AccionBitacora.RECUPERAR_PASSWORD,
                descripcion=f'Solicitud reset password: {usuario.email}',
                ip_origen=get_client_ip(request),
            )
        except Usuario.DoesNotExist:
            pass

        return Response({'mensaje': 'Si el correo existe, recibirás instrucciones en breve.'})


class ResetPasswordConfirmView(APIView):
    """
    POST /api/auth/reset-password/confirm/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_obj, error = validar_token_recuperacion(serializer.validated_data['token'])

        if error:
            return Response(
                {'error': error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = token_obj.id_usuario
        usuario.set_password(serializer.validated_data['password_nuevo'])
        usuario.save(update_fields=['password'])

        token_obj.usado = True
        token_obj.save(update_fields=['usado'])

        registrar_bitacora(
            usuario=usuario,
            modulo='auth',
            accion=AccionBitacora.CAMBIAR_PASSWORD,
            descripcion=f'Password restablecida via token: {usuario.username}',
            ip_origen=get_client_ip(request),
        )

        return Response({'mensaje': 'Contraseña restablecida correctamente.'})


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de usuarios.
    """
    queryset = Usuario.objects.all().order_by('apellidos', 'nombres')
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def get_serializer_class(self):
        return UsuarioCreateSerializer if self.action == 'create' else UsuarioSerializer

    def perform_create(self, serializer):
        usuario = serializer.save()

        registrar_bitacora(
            usuario=self.request.user,
            modulo='users',
            accion=AccionBitacora.CREAR,
            descripcion=f'Creó usuario: {usuario.username}',
            tabla_afectada='usuarios',
            id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        usuario = serializer.save()

        registrar_bitacora(
            usuario=self.request.user,
            modulo='users',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó usuario: {usuario.username}',
            tabla_afectada='usuarios',
            id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        registrar_bitacora(
            usuario=self.request.user,
            modulo='users',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó usuario: {instance.username}',
            tabla_afectada='usuarios',
            id_registro_afectado=instance.id,
            ip_origen=get_client_ip(self.request),
        )
        instance.delete()

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        usuario = self.get_object()
        usuario.estado = 'ACTIVO'
        usuario.is_active = True
        usuario.save(update_fields=['estado', 'is_active'])

        return Response({'mensaje': f'Usuario {usuario.username} activado.'})

    @action(detail=True, methods=['post'])
    def bloquear(self, request, pk=None):
        usuario = self.get_object()
        usuario.estado = 'BLOQUEADO'
        usuario.is_active = False
        usuario.save(update_fields=['estado', 'is_active'])

        return Response({'mensaje': f'Usuario {usuario.username} bloqueado.'})

    @action(detail=True, methods=['get', 'post'], url_path='roles')
    def roles(self, request, pk=None):
        from apps.usuarios.roles.models import UsuarioRol
        from apps.usuarios.roles.serializers import UsuarioRolSerializer

        usuario = self.get_object()

        if request.method == 'GET':
            asignaciones = UsuarioRol.objects.filter(
                id_usuario=usuario,
            ).select_related('id_rol')

            return Response(UsuarioRolSerializer(asignaciones, many=True).data)

        data = {**request.data, 'id_usuario': usuario.pk}
        serializer = UsuarioRolSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)
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

from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .emails import enviar_bienvenida, enviar_recuperacion_password
from .models import Usuario
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


def _jwt_response(usuario):
    """Genera respuesta estándar con tokens JWT + datos del usuario."""
    refresh = RefreshToken.for_user(usuario)
    return {
        'usuario': UsuarioSerializer(usuario).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


# ---------------------------------------------------------------------------
# Auth Views
# ---------------------------------------------------------------------------

class RegisterView(APIView):
    """
    POST /api/auth/register/
    Registro público. Crea Paciente o Especialista automáticamente según tipo_usuario.
    Retorna JWT para login inmediato post-registro.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        extra = getattr(usuario, '_extra_registro', {})
        self._crear_perfil(usuario, extra)

        enviar_bienvenida(usuario)

        registrar_bitacora(
            usuario=usuario, modulo='auth', accion=AccionBitacora.CREAR,
            descripcion=f'Nuevo registro: {usuario.username} ({usuario.tipo_usuario})',
            tabla_afectada='usuarios', id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(_jwt_response(usuario), status=status.HTTP_201_CREATED)

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
                logger.error(f'[register] Error creando Paciente: {exc}')

        elif usuario.tipo_usuario in ('MEDICO', 'ESPECIALISTA'):
            try:
                from apps.atencionClinica.especialistas.models import Especialista
                Especialista.objects.create(
                    usuario=usuario,
                    especialidad=extra.get('especialidad', 'General'),
                    codigo_profesional=extra.get('codigo_profesional') or None,
                )
            except Exception as exc:
                logger.error(f'[register] Error creando Especialista: {exc}')


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "..." } — solo correo electrónico.
    Retorna JWT + datos del usuario.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.validated_data['user']

        usuario.ultimo_acceso = timezone.now()
        usuario.save(update_fields=['ultimo_acceso'])

        registrar_bitacora(
            usuario=usuario, modulo='auth', accion=AccionBitacora.LOGIN,
            descripcion=f'Login exitoso: {usuario.username}',
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(_jwt_response(usuario))


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
            return Response({'error': 'Se requiere el refresh token.'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({'error': 'Token inválido o ya expirado.'}, status=400)

        registrar_bitacora(
            usuario=request.user, modulo='auth', accion=AccionBitacora.LOGOUT,
            descripcion=f'Logout: {request.user.username}',
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response({'mensaje': 'Sesión cerrada correctamente.'})


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/  — Ver perfil propio
    PATCH /api/auth/me/  — Editar perfil propio
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PerfilSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='auth', accion=AccionBitacora.EDITAR,
            descripcion=f'Perfil actualizado: {self.request.user.username}',
            tabla_afectada='usuarios', id_registro_afectado=self.request.user.id,
            ip_origen=get_client_ip(self.request),
        )


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['password_actual']):
            return Response({'error': 'La contraseña actual es incorrecta.'}, status=400)

        request.user.set_password(serializer.validated_data['password_nuevo'])
        request.user.save(update_fields=['password'])

        registrar_bitacora(
            usuario=request.user, modulo='auth', accion=AccionBitacora.CAMBIAR_PASSWORD,
            descripcion=f'Cambio de contraseña: {request.user.username}',
            ip_origen=get_client_ip(request),
        )
        return Response({'mensaje': 'Contraseña actualizada correctamente.'})


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Envía email con token de reset. Siempre responde 200 (no revela si el email existe).
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
                usuario=usuario, modulo='auth', accion=AccionBitacora.RECUPERAR_PASSWORD,
                descripcion=f'Solicitud reset password: {usuario.email}',
                ip_origen=get_client_ip(request),
            )
        except Usuario.DoesNotExist:
            pass

        return Response({'mensaje': 'Si el correo existe, recibirás instrucciones en breve.'})


class ResetPasswordConfirmView(APIView):
    """POST /api/auth/reset-password/confirm/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_obj, error = validar_token_recuperacion(serializer.validated_data['token'])
        if error:
            return Response({'error': error}, status=400)

        usuario = token_obj.id_usuario
        usuario.set_password(serializer.validated_data['password_nuevo'])
        usuario.save(update_fields=['password'])
        token_obj.usado = True
        token_obj.save(update_fields=['usado'])

        registrar_bitacora(
            usuario=usuario, modulo='auth', accion=AccionBitacora.CAMBIAR_PASSWORD,
            descripcion=f'Password restablecida via token: {usuario.username}',
            ip_origen=get_client_ip(request),
        )
        return Response({'mensaje': 'Contraseña restablecida correctamente.'})


# ---------------------------------------------------------------------------
# Gestión de Usuarios (Admin/Administrativo)
# ---------------------------------------------------------------------------

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de usuarios.
    GET/POST    /api/users/
    GET/PUT/PATCH/DELETE /api/users/{id}/
    POST        /api/users/{id}/activar/
    POST        /api/users/{id}/bloquear/
    GET/POST    /api/users/{id}/roles/   (consulta/asigna roles via apps.usuarios.roles)
    """
    queryset = Usuario.objects.all().order_by('apellidos', 'nombres')
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    def get_serializer_class(self):
        return UsuarioCreateSerializer if self.action == 'create' else UsuarioSerializer

    def perform_create(self, serializer):
        usuario = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='users', accion=AccionBitacora.CREAR,
            descripcion=f'Creó usuario: {usuario.username}',
            tabla_afectada='usuarios', id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        usuario = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='users', accion=AccionBitacora.EDITAR,
            descripcion=f'Editó usuario: {usuario.username}',
            tabla_afectada='usuarios', id_registro_afectado=usuario.id,
            ip_origen=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        registrar_bitacora(
            usuario=self.request.user, modulo='users', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó usuario: {instance.username}',
            tabla_afectada='usuarios', id_registro_afectado=instance.id,
            ip_origen=get_client_ip(self.request),
        )
        instance.delete()

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """POST /api/users/{id}/activar/"""
        usuario = self.get_object()
        usuario.estado = 'ACTIVO'
        usuario.is_active = True
        usuario.save(update_fields=['estado', 'is_active'])
        return Response({'mensaje': f'Usuario {usuario.username} activado.'})

    @action(detail=True, methods=['post'])
    def bloquear(self, request, pk=None):
        """POST /api/users/{id}/bloquear/"""
        usuario = self.get_object()
        usuario.estado = 'BLOQUEADO'
        usuario.is_active = False
        usuario.save(update_fields=['estado', 'is_active'])
        return Response({'mensaje': f'Usuario {usuario.username} bloqueado.'})

    @action(detail=True, methods=['get', 'post'], url_path='roles')
    def roles(self, request, pk=None):
        """
        GET  /api/users/{id}/roles/ — Roles asignados al usuario
        POST /api/users/{id}/roles/ — Asignar rol al usuario
        Body: { "id_rol": <id> }
        """
        from apps.usuarios.roles.models import UsuarioRol
        from apps.usuarios.roles.serializers import UsuarioRolSerializer

        usuario = self.get_object()
        if request.method == 'GET':
            asignaciones = UsuarioRol.objects.filter(
                id_usuario=usuario
            ).select_related('id_rol')
            return Response(UsuarioRolSerializer(asignaciones, many=True).data)

        data = {**request.data, 'id_usuario': usuario.pk}
        serializer = UsuarioRolSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

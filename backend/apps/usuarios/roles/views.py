"""
apps/roles/views.py

Endpoints:
  GET/POST       /api/roles/
  GET/PUT/PATCH  /api/roles/{id}/
  DELETE         /api/roles/{id}/
  GET/POST       /api/roles/{id}/permisos/     — Permisos asignados a un rol
  DELETE         /api/roles/{id}/permisos/{pid}/ — Quitar permiso de rol
"""
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdmin, IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Rol, RolPermiso, UsuarioRol
from .serializers import RolPermisoSerializer, RolSerializer, UsuarioRolSerializer


class RolViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de roles del sistema. Solo accesible por ADMIN.
    GET/POST /api/roles/
    GET/PUT/PATCH/DELETE /api/roles/{id}/
    """
    queryset = Rol.objects.prefetch_related('rol_permisos__id_permiso').all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'activo']
    ordering = ['nombre']

    def perform_create(self, serializer):
        rol = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.CREAR,
            descripcion=f'Creó rol: {rol.nombre}',
            tabla_afectada='roles', id_registro_afectado=rol.id_rol,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        rol = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.EDITAR,
            descripcion=f'Editó rol: {rol.nombre}',
            tabla_afectada='roles', id_registro_afectado=rol.id_rol,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        rid, nombre = instance.id_rol, instance.nombre
        super().perform_destroy(instance)
        registrar_bitacora(
            usuario=self.request.user, modulo='roles', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó rol: {nombre}',
            tabla_afectada='roles', id_registro_afectado=rid,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    @action(detail=True, methods=['get', 'post'], url_path='permisos')
    def permisos(self, request, pk=None):
        """
        GET /api/roles/{id}/permisos/   — Ver permisos del rol
        POST /api/roles/{id}/permisos/  — Asignar permiso al rol
        Body POST: { "id_permiso": <id> }
        """
        rol = self.get_object()
        if request.method == 'GET':
            asignaciones = RolPermiso.objects.filter(id_rol=rol).select_related('id_permiso')
            return Response(RolPermisoSerializer(asignaciones, many=True).data)

        serializer = RolPermisoSerializer(data={**request.data, 'id_rol': rol.pk})
        serializer.is_valid(raise_exception=True)
        rp = serializer.save()
        perm = rp.id_permiso
        registrar_bitacora(
            usuario=request.user, modulo='roles', accion=AccionBitacora.CREAR,
            descripcion=f'Asignó permiso «{perm.nombre}» al rol «{rol.nombre}»',
            tabla_afectada='rol_permisos', id_registro_afectado=perm.id_permiso,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=['delete'],
        url_path=r'permisos/(?P<permiso_pk>[0-9]+)',
    )
    def quitar_permiso(self, request, pk=None, permiso_pk=None):
        """DELETE /api/roles/{id}/permisos/{permiso_pk}/ — Quitar permiso del rol"""
        rol = self.get_object()
        deleted, _ = RolPermiso.objects.filter(
            id_rol=rol, id_permiso_id=permiso_pk
        ).delete()
        if not deleted:
            return Response({'error': 'Asignación no encontrada.'}, status=404)
        registrar_bitacora(
            usuario=request.user, modulo='roles', accion=AccionBitacora.ELIMINAR,
            descripcion=f'Quitó permiso id {permiso_pk} del rol «{rol.nombre}»',
            tabla_afectada='rol_permisos', id_registro_afectado=int(permiso_pk),
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class UsuarioRolViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Gestión de roles asignados a usuarios.
    GET    /api/usuario-roles/              — Listar asignaciones
    POST   /api/usuario-roles/              — Asignar rol a usuario
    DELETE /api/usuario-roles/{id}/         — Quitar asignación
    """
    queryset = UsuarioRol.objects.select_related('id_usuario', 'id_rol').all()
    serializer_class = UsuarioRolSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

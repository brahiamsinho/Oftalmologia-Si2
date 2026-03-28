"""
apps/roles/views.py

Endpoints:
  GET/POST       /api/v1/roles/
  GET/PUT/PATCH  /api/v1/roles/{id}/
  DELETE         /api/v1/roles/{id}/
  GET/POST       /api/v1/roles/{id}/permisos/     — Permisos asignados a un rol
  DELETE         /api/v1/roles/{id}/permisos/{pid}/ — Quitar permiso de rol
"""
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsAdministrativoOrAdmin

from .models import Rol, RolPermiso, UsuarioRol
from .serializers import RolPermisoSerializer, RolSerializer, UsuarioRolSerializer


class RolViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de roles del sistema. Solo accesible por ADMIN.
    GET/POST /api/v1/roles/
    GET/PUT/PATCH/DELETE /api/v1/roles/{id}/
    """
    queryset = Rol.objects.prefetch_related('rol_permisos__id_permiso').all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'activo']
    ordering = ['nombre']

    @action(detail=True, methods=['get', 'post'], url_path='permisos')
    def permisos(self, request, pk=None):
        """
        GET /api/v1/roles/{id}/permisos/   — Ver permisos del rol
        POST /api/v1/roles/{id}/permisos/  — Asignar permiso al rol
        Body POST: { "id_permiso": <id> }
        """
        rol = self.get_object()
        if request.method == 'GET':
            asignaciones = RolPermiso.objects.filter(id_rol=rol).select_related('id_permiso')
            return Response(RolPermisoSerializer(asignaciones, many=True).data)

        serializer = RolPermisoSerializer(data={**request.data, 'id_rol': rol.pk})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=['delete'],
        url_path=r'permisos/(?P<permiso_pk>[0-9]+)',
    )
    def quitar_permiso(self, request, pk=None, permiso_pk=None):
        """DELETE /api/v1/roles/{id}/permisos/{permiso_pk}/ — Quitar permiso del rol"""
        rol = self.get_object()
        deleted, _ = RolPermiso.objects.filter(
            id_rol=rol, id_permiso_id=permiso_pk
        ).delete()
        if not deleted:
            return Response({'error': 'Asignación no encontrada.'}, status=404)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UsuarioRolViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Gestión de roles asignados a usuarios.
    GET    /api/v1/usuario-roles/              — Listar asignaciones
    POST   /api/v1/usuario-roles/              — Asignar rol a usuario
    DELETE /api/v1/usuario-roles/{id}/         — Quitar asignación
    """
    queryset = UsuarioRol.objects.select_related('id_usuario', 'id_rol').all()
    serializer_class = UsuarioRolSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

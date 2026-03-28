"""
apps/core/permissions.py
Permisos DRF basados en tipo_usuario del CustomUser.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Sólo el tipo ADMIN del sistema."""
    message = 'Acceso exclusivo para administradores.'

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated
            and request.user.tipo_usuario == 'ADMIN'
        )


class IsAdministrativoOrAdmin(BasePermission):
    """ADMIN o personal ADMINISTRATIVO (recepción, etc.)."""
    message = 'Acceso restringido a personal administrativo.'

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated
            and request.user.tipo_usuario in ('ADMIN', 'ADMINISTRATIVO')
        )


class IsMedicoOrAdmin(BasePermission):
    """ADMIN, MEDICO o ESPECIALISTA."""
    message = 'Acceso restringido a médicos y especialistas.'

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated
            and request.user.tipo_usuario in ('ADMIN', 'MEDICO', 'ESPECIALISTA')
        )


class IsPaciente(BasePermission):
    """Sólo pacientes."""
    message = 'Acceso restringido a pacientes.'

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated
            and request.user.tipo_usuario == 'PACIENTE'
        )


class IsStaffOrReadOnly(BasePermission):
    """Lectura pública; escritura sólo para staff."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user and request.user.is_staff

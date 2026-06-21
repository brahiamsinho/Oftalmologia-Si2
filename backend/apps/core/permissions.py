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


class IsStaffUser(BasePermission):
    """Personal clínico/administrativo activo (ADMIN, ADMINISTRATIVO, MEDICO, ESPECIALISTA)."""
    message = 'Acceso restringido a personal del sistema.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.tipo_usuario in (
            'ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA',
        )


class IsStaffOrReadOnly(BasePermission):
    """Lectura pública; escritura sólo para staff."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user and request.user.is_staff


class IsPacienteOrStaff(BasePermission):
    """Paciente o personal clínico/administrativo activo."""
    message = 'Acceso restringido a pacientes y personal autorizado.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.tipo_usuario in (
            'PACIENTE', 'ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA',
        )


class IsPlatformAdministrator(BasePermission):
    """
    Solo sesión JWT de plataforma (``PlatformJWTUser`` / ``platform_administrator``).
    """

    message = 'Acceso exclusivo para administradores de la plataforma SaaS.'

    def has_permission(self, request, view):
        admin = getattr(request.user, 'platform_administrator', None)
        return (
            request.user
            and request.user.is_authenticated
            and admin is not None
            and admin.is_active
        )

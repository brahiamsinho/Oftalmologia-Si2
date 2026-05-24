"""
Permisos CU20 — facturación clínica.
"""
from decouple import config
from rest_framework.permissions import BasePermission

from apps.core.permissions import IsAdministrativoOrAdmin, IsPaciente
from apps.pacientes.pacientes.models import Paciente


class PasarelaWebhookPermission(BasePermission):
    """
    Webhook simulado: header X-Pasarela-Secret o personal administrativo.
    """

    message = 'No autorizado para confirmar la pasarela.'

    def has_permission(self, request, view):
        if IsAdministrativoOrAdmin().has_permission(request, view):
            return True
        secret = config('PASARELA_MOCK_SECRET', default='dev-pasarela-secret')
        header = request.headers.get('X-Pasarela-Secret') or request.META.get('HTTP_X_PASARELA_SECRET')
        return bool(secret and header and header == secret)


class EsPropietarioFacturaPaciente(BasePermission):
    """Paciente dueño de la factura."""

    message = 'No puede operar sobre facturas de otros pacientes.'

    def has_object_permission(self, request, view, obj):
        if not IsPaciente().has_permission(request, view):
            return True
        paciente = Paciente.objects.filter(usuario=request.user).first()
        return paciente is not None and obj.id_paciente_id == paciente.pk

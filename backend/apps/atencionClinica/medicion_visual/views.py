from django.db import transaction
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.pacientes.pacientes.models import Paciente

from .models import MedicionVisual
from .serializers import MedicionVisualSerializer


class MedicionVisualViewSet(viewsets.ModelViewSet):
    queryset = MedicionVisual.objects.all().order_by('-fecha')
    serializer_class = MedicionVisualSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related('paciente', 'consulta', 'consulta__especialista')
        )
        user = self.request.user
        if not user.is_authenticated:
            return MedicionVisual.objects.none()
        tipo = getattr(user, 'tipo_usuario', '') or ''
        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return MedicionVisual.objects.none()
            return queryset.filter(paciente=paciente)
        if tipo in ('MEDICO', 'ESPECIALISTA'):
            return queryset.filter(consulta__especialista=user).distinct()
        if tipo in ('ADMIN', 'ADMINISTRATIVO'):
            paciente_id = self.request.query_params.get('paciente_id')
            if paciente_id:
                queryset = queryset.filter(paciente_id=paciente_id)
            return queryset
        return MedicionVisual.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        inst = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='medicion_visual',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró medición visual #{inst.pk} — paciente {inst.paciente_id}',
            tabla_afectada='medicion_visual_medicionvisual',
            id_registro_afectado=inst.pk,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        inst = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='medicion_visual',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó medición visual #{inst.pk}',
            tabla_afectada='medicion_visual_medicionvisual',
            id_registro_afectado=inst.pk,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        mid = instance.pk
        registrar_bitacora(
            usuario=self.request.user,
            modulo='medicion_visual',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó medición visual #{mid}',
            tabla_afectada='medicion_visual_medicionvisual',
            id_registro_afectado=mid,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)

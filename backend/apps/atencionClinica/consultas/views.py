from django.db import transaction

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.atencionClinica.citas.models import EstadoCita
from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Consulta, Estudio
from .serializers import ConsultaSerializer, EstudioSerializer


class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all().order_by('-fecha')
    serializer_class = ConsultaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        paciente_id = self.request.query_params.get('paciente_id')
        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        consulta = serializer.save(especialista=self.request.user)
        if consulta.cita_id:
            cita = consulta.cita
            if cita.estado in (
                EstadoCita.PROGRAMADA,
                EstadoCita.CONFIRMADA,
                EstadoCita.REPROGRAMADA,
            ):
                cita.estado = EstadoCita.ATENDIDA
                cita.save(update_fields=['estado'])
        registrar_bitacora(
            usuario=self.request.user,
            modulo='consultas',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró consulta #{consulta.pk} — paciente {consulta.paciente_id}',
            tabla_afectada='consultas',
            id_registro_afectado=consulta.pk,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        consulta = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='consultas',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó consulta #{consulta.pk}',
            tabla_afectada='consultas',
            id_registro_afectado=consulta.pk,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        cid = instance.pk
        registrar_bitacora(
            usuario=self.request.user,
            modulo='consultas',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó consulta #{cid}',
            tabla_afectada='consultas',
            id_registro_afectado=cid,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)


class EstudioViewSet(viewsets.ModelViewSet):
    queryset = Estudio.objects.all().order_by('-fecha')
    serializer_class = EstudioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        paciente_id = self.request.query_params.get('paciente_id')
        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)
        return queryset

    def perform_create(self, serializer):
        estudio = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='estudios',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registró estudio {estudio.get_tipo_estudio_display()} #{estudio.pk}',
            tabla_afectada='estudios',
            id_registro_afectado=estudio.pk,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        estudio = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='estudios',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó estudio #{estudio.pk}',
            tabla_afectada='estudios',
            id_registro_afectado=estudio.pk,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        eid = instance.pk
        registrar_bitacora(
            usuario=self.request.user,
            modulo='estudios',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó estudio #{eid}',
            tabla_afectada='estudios',
            id_registro_afectado=eid,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DispositivoFcm, Notificacion
from .serializers import (
    DispositivoFcmRegisterSerializer,
    DispositivoFcmSerializer,
    NotificacionSerializer,
)
from .services import registrar_dispositivo_fcm


class DispositivoFcmRegisterView(APIView):
    """
    POST: registra o actualiza el token FCM del usuario autenticado.
    DELETE ?token=...: elimina el dispositivo (p. ej. al cerrar sesión en el móvil).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = DispositivoFcmRegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        token = ser.validated_data['token']
        plataforma = ser.validated_data['plataforma']

        obj = registrar_dispositivo_fcm(request.user, token, plataforma)
        if obj is None:
            return Response(
                {'detail': 'No se pudo registrar el dispositivo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        out = DispositivoFcmSerializer(obj)
        return Response(out.data, status=status.HTTP_200_OK)

    def delete(self, request):
        token = request.query_params.get('token', '').strip()
        if not token:
            return Response(
                {'detail': 'Parámetro token requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = DispositivoFcm.objects.filter(
            usuario=request.user,
            token=token,
        ).delete()
        if deleted == 0:
            return Response({'detail': 'Token no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificacionListView(APIView):
    """
    GET: devuelve el historial de notificaciones del usuario autenticado (más recientes primero).
    Acepta ?no_leidas=true para filtrar solo las no leídas.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notificacion.objects.filter(usuario=request.user)
        if request.query_params.get('no_leidas', '').lower() == 'true':
            qs = qs.filter(leida=False)
        ser = NotificacionSerializer(qs[:50], many=True)
        no_leidas = Notificacion.objects.filter(usuario=request.user, leida=False).count()
        return Response({'results': ser.data, 'no_leidas': no_leidas})


class NotificacionLeerView(APIView):
    """
    POST /notificaciones/{id}/leer/ : marca una notificación como leída.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notificacion.objects.get(pk=pk, usuario=request.user)
        except Notificacion.DoesNotExist:
            return Response({'detail': 'No encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        notif.leida = True
        notif.save(update_fields=['leida'])
        return Response(NotificacionSerializer(notif).data)


class NotificacionMarcarTodasLeidasView(APIView):
    """
    POST /notificaciones/leer-todas/ : marca todas las notificaciones del usuario como leídas.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notificacion.objects.filter(usuario=request.user, leida=False).update(leida=True)
        return Response({'marcadas': updated})

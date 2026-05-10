from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.authentication import PlatformJWTAuthentication
from apps.core.permissions import IsPlatformAdministrator

from .serializers import PlatformAdministratorSerializer, PlatformLoginSerializer
from .tokens import PlatformAccessToken


class PlatformLoginView(APIView):
    """
    POST /api/public/platform/auth/login/

    Autenticación de operadores de la plataforma (schema public).
    No emite refresh (evita blacklist de simplejwt ligada a AUTH_USER_MODEL tenant).
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PlatformLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin = serializer.validated_data['administrator']

        access = PlatformAccessToken.for_admin(admin)
        return Response(
            {
                'access': str(access),
                'administrator': PlatformAdministratorSerializer(admin).data,
            },
            status=status.HTTP_200_OK,
        )


class PlatformMeView(APIView):
    """
    GET /api/public/platform/auth/me/

    Útil para comprobar sesión plataforma desde el frontend.
    """

    authentication_classes = [PlatformJWTAuthentication]
    permission_classes = [IsPlatformAdministrator]

    def get(self, request):
        return Response(
            {'administrator': PlatformAdministratorSerializer(request.user.platform_administrator).data},
        )

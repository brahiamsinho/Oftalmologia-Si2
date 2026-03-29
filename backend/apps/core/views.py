"""
apps/core/views.py
Health-check endpoint para monitoreo del servicio.
"""
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/v1/health/
    Confirma que el API y la base de datos están operativos.
    """
    try:
        connection.ensure_connection()
        db_status = 'connected'
    except Exception:
        db_status = 'disconnected'

    ok = db_status == 'connected'
    return Response(
        {
            'status': 'ok' if ok else 'error',
            'database': db_status,
            'service': 'Clínica Oftalmológica Si2 — API v1',
        },
        status=200 if ok else 503,
    )

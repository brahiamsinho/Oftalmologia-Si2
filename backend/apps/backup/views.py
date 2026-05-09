"""
apps/backup/views.py
ViewSets para el sistema de backup/restore.
"""
import logging

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.backup.models import TenantBackup, TenantBackupConfig
from apps.backup.serializers import (
    BackupConfigSerializer,
    BackupPlanInfoSerializer,
    BackupRestoreSerializer,
    TenantBackupSerializer,
)
from apps.backup.services import BackupService
from apps.backup.validators import (
    validate_backup_limit,
    validate_concurrent_restore,
    validate_restore_permission,
)
from apps.bitacora.models import AccionBitacora, Bitacora

logger = logging.getLogger(__name__)


class TenantBackupViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar backups del tenant actual.

    Endpoints:
    - GET /api/organization/backup/ → Lista backups del tenant
    - POST /api/organization/backup/ → Crea backup manual
    - GET /api/organization/backup/{id}/ → Detalle de backup
    - GET /api/organization/backup/{id}/download/ → Descarga archivo
    - POST /api/organization/backup/{id}/restore/ → Restaura backup
    - DELETE /api/organization/backup/{id}/ → Elimina backup
    """
    serializer_class = TenantBackupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retorna backups del schema tenant actual (aislamiento por django-tenants)."""
        return TenantBackup.objects.all().select_related('creado_por', 'restaurado_por')

    @action(detail=False, methods=['get'], url_path='plan-info')
    def plan_info(self, request):
        """Retorna información de límites del plan actual."""
        from apps.backup.validators import get_plan_limits

        tenant = request.tenant
        subscription = getattr(tenant, 'subscription', None)

        if not subscription or not subscription.esta_activa:
            return Response(
                {'error': 'No hay suscripción activa'},
                status=status.HTTP_403_FORBIDDEN,
            )

        plan_codigo = subscription.plan.codigo
        limits = get_plan_limits(plan_codigo)

        backups_actuales = TenantBackup.objects.filter(
            estado__in=['COMPLETADO', 'EN_PROGRESO', 'PENDIENTE'],
        ).count()

        max_backups = limits['max_backups']
        if max_backups == -1:
            backups_restantes = -1
        else:
            backups_restantes = max(0, max_backups - backups_actuales)

        serializer = BackupPlanInfoSerializer({
            'plan_codigo': plan_codigo,
            'plan_nombre': subscription.plan.nombre,
            'max_backups': max_backups,
            'retencion_dias': limits['retencion_dias'],
            'permite_restore': limits['permite_restore'],
            'permite_automatico': limits['permite_automatico'],
            'backups_actuales': backups_actuales,
            'backups_restantes': backups_restantes,
        })

        return Response(serializer.data)

    def create(self, request):
        """
        Crea un backup manual del tenant actual.

        Valida:
        - Límite por plan
        - Que no haya otra operación en progreso
        """
        tenant = request.tenant

        # Validar límite por plan
        try:
            validate_backup_limit(tenant, is_automatic=False)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

        # Validar que no haya operación en progreso
        try:
            validate_concurrent_restore(tenant)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)

        # Obtener retención del plan o configuración
        config = getattr(tenant, 'backup_config', None)
        if config:
            retencion_dias = config.retencion_dias
        else:
            # Default según plan
            subscription = getattr(tenant, 'subscription', None)
            if subscription:
                from apps.backup.validators import get_plan_limits
                limits = get_plan_limits(subscription.plan.codigo)
                retencion_dias = limits['retencion_dias']
            else:
                retencion_dias = 7

        expira_en = timezone.now() + timezone.timedelta(days=retencion_dias)

        # Crear registro de backup
        backup = TenantBackup.objects.create(
            archivo='',
            tamaño_mb=0,
            estado='EN_PROGRESO',
            expira_en=expira_en,
            creado_por=request.user,
        )

        # Ejecutar backup
        try:
            path, size = BackupService.create_backup(tenant=tenant, user=request.user)

            backup.archivo = path
            backup.tamaño_mb = size
            backup.estado = 'COMPLETADO'
            backup.save()

            # Bitácora
            Bitacora.objects.create(
                modulo='BACKUP',
                accion=AccionBitacora.CREAR,
                tabla_afectada='tenant_backups',
                id_registro_afectado=backup.pk,
                descripcion=f'Backup manual creado ({size:.2f} MB)',
                ip_origen=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )

            return Response(
                TenantBackupSerializer(backup).data,
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            backup.estado = 'FALLIDO'
            backup.save()

            Bitacora.objects.create(
                modulo='BACKUP',
                accion=AccionBitacora.CREAR,
                tabla_afectada='tenant_backups',
                id_registro_afectado=backup.pk,
                descripcion=f'Backup manual fallido: {str(e)}',
                ip_origen=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )

            logger.error(f'Error creando backup: {e}')
            return Response(
                {'error': f'Error creando backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura un backup específico.

        Requiere:
        - confirmación explícita (body: {"confirmar": true})
        - motivo (recomendado para auditoría)
        - plan que permita restore
        """
        backup = self.get_object()
        tenant = request.tenant

        # Validar permiso de restore
        try:
            validate_restore_permission(tenant)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

        # Validar que no haya operación en progreso
        try:
            validate_concurrent_restore(tenant)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)

        # Validar serializer
        serializer = BackupRestoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Ejecutar restore
        try:
            BackupService.restore_backup(
                backup=backup,
                user=request.user,
                motivo=serializer.validated_data.get('motivo', ''),
                tenant=tenant,
            )

            # Bitácora
            Bitacora.objects.create(
                modulo='BACKUP',
                accion=AccionBitacora.CREAR,
                tabla_afectada='tenant_backups',
                id_registro_afectado=backup.pk,
                descripcion=f'Backup restaurado. Motivo: {serializer.validated_data.get("motivo", "No especificado")}',
                ip_origen=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )

            return Response({
                'mensaje': 'Backup restaurado exitosamente',
                'backup': TenantBackupSerializer(backup).data,
            })

        except Exception as e:
            logger.error(f'Error restaurando backup {backup.pk}: {e}')

            Bitacora.objects.create(
                modulo='BACKUP',
                accion=AccionBitacora.CREAR,
                tabla_afectada='tenant_backups',
                id_registro_afectado=backup.pk,
                descripcion=f'Restore fallido: {str(e)}',
                ip_origen=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )

            return Response(
                {'error': f'Error restaurando backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Descarga el archivo de backup.
        """
        backup = self.get_object()

        try:
            backup_file = BackupService.get_backup_file(backup)
            content = backup_file.read()

            from django.http import HttpResponse
            response = HttpResponse(content, content_type='application/gzip')
            response['Content-Disposition'] = f'attachment; filename="backup_{backup.pk}.sql.gz"'
            return response

        except Exception as e:
            return Response(
                {'error': f'Error descargando backup: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND,
            )

    def destroy(self, request, *args, **kwargs):
        """Elimina un backup del storage y la base de datos."""
        backup = self.get_object()

        try:
            BackupService.delete_backup(backup)

            Bitacora.objects.create(
                modulo='BACKUP',
                accion=AccionBitacora.ELIMINAR,
                tabla_afectada='tenant_backups',
                id_registro_afectado=backup.pk,
                descripcion='Backup eliminado manualmente',
                ip_origen=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )

            backup.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response(
                {'error': f'Error eliminando backup: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BackupConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet para configuración de backups automáticos.

    Endpoints:
    - GET /api/organization/backup-config/ → Obtiene configuración
    - PATCH /api/organization/backup-config/ → Actualiza configuración
    """
    serializer_class = BackupConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Aislamiento por schema tenant (django-tenants), no existe FK tenant en modelo
        return TenantBackupConfig.objects.all().order_by('id_config')

    def retrieve(self, request, *args, **kwargs):
        """Obtiene o crea la configuración del tenant."""
        config, created = TenantBackupConfig.objects.get_or_create(
            defaults={
                'backup_automatico': True,
                'hora_backup': '03:00:00',
                'frecuencia': 'daily',
                'retencion_dias': 7,
            }
        )
        serializer = self.get_serializer(config)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Actualiza la configuración de backups automáticos."""
        config, created = TenantBackupConfig.objects.get_or_create(
            defaults={
                'backup_automatico': True,
                'hora_backup': '03:00:00',
                'frecuencia': 'daily',
                'retencion_dias': 7,
            }
        )

        serializer = self.get_serializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Bitácora
        Bitacora.objects.create(
            modulo='BACKUP_CONFIG',
            accion=AccionBitacora.EDITAR,
            tabla_afectada='tenant_backup_configs',
            id_registro_afectado=config.pk,
            descripcion=f'Configuración de backup actualizada: {request.data}',
            ip_origen=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response(serializer.data)

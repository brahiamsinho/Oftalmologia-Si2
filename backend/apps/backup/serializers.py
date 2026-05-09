"""
apps/backup/serializers.py
Serializers para el sistema de backup/restore.
"""
from rest_framework import serializers

from apps.backup.models import TenantBackup, TenantBackupConfig


class TenantBackupSerializer(serializers.ModelSerializer):
    """
    Serializer para listar y crear backups.
    """
    expira_en = serializers.DateTimeField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)

    class Meta:
        model = TenantBackup
        fields = [
            'id_backup',
            'estado',
            'tamaño_mb',
            'creado_en',
            'expira_en',
            'dias_restantes',
            'creado_por_nombre',
            'restaurado_en',
            'motivo_restore',
        ]
        read_only_fields = [
            'id_backup',
            'estado',
            'tamaño_mb',
            'creado_en',
            'expira_en',
            'dias_restantes',
            'creado_por_nombre',
            'restaurado_en',
        ]


class BackupRestoreSerializer(serializers.Serializer):
    """
    Serializer para solicitar restore de un backup.
    Requiere confirmación explícita y motivo.
    """
    confirmar = serializers.BooleanField(
        required=True,
        help_text='Confirmación explícita de que se entiende el riesgo',
    )
    motivo = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        default='',
        help_text='Motivo de la restauración (recomendado para auditoría)',
    )

    def validate_confirmar(self, value):
        if not value:
            raise serializers.ValidationError('Debe confirmar explícitamente la restauración')
        return value


class BackupConfigSerializer(serializers.ModelSerializer):
    """
    Serializer para configuración de backups automáticos.
    """
    class Meta:
        model = TenantBackupConfig
        fields = [
            'id_config',
            'backup_automatico',
            'hora_backup',
            'frecuencia',
            'retencion_dias',
            'creado_en',
            'actualizado_en',
        ]
        read_only_fields = ['id_config', 'creado_en', 'actualizado_en']

    def validate_retencion_dias(self, value):
        if value < 1:
            raise serializers.ValidationError('La retención debe ser al menos 1 día')
        if value > 365:
            raise serializers.ValidationError('La retención no puede exceder 365 días')
        return value


class BackupPlanInfoSerializer(serializers.Serializer):
    """
    Serializer para información de límites del plan actual.
    """
    plan_codigo = serializers.CharField()
    plan_nombre = serializers.CharField()
    max_backups = serializers.IntegerField()
    retencion_dias = serializers.IntegerField()
    permite_restore = serializers.BooleanField()
    permite_automatico = serializers.BooleanField()
    backups_actuales = serializers.IntegerField()
    backups_restantes = serializers.IntegerField()

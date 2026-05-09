"""
apps/backup/validators.py
Validación de límites de backup por plan.
"""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.backup.models import TenantBackup


def get_plan_limits(plan_codigo):
    """
    Retorna los límites de backup para un plan.

    Args:
        plan_codigo: Código del plan (FREE, PLUS, PRO)

    Returns:
        dict con max_backups, retencion_dias, permite_restore, permite_automatico
    """
    limits = getattr(settings, 'BACKUP_PLAN_LIMITS', {})
    return limits.get(plan_codigo, {
        'max_backups': 0,
        'retencion_dias': 0,
        'permite_restore': False,
        'permite_automatico': False,
    })


def validate_backup_limit(tenant, is_automatic=False):
    """
    Valida si el tenant puede crear un backup según su plan.

    Args:
        tenant: Instancia de Tenant
        is_automatic: Si es backup automático (ignora límite para automáticos)

    Raises:
        PermissionError: Si el tenant no puede crear backups
    """
    # Obtener plan activo
    subscription = getattr(tenant, 'subscription', None)
    if not subscription or not subscription.esta_activa:
        raise PermissionError('No hay suscripción activa')

    plan_codigo = subscription.plan.codigo
    limits = get_plan_limits(plan_codigo)

    # Verificar si el plan permite backups automáticos
    if is_automatic and not limits['permite_automatico']:
        raise PermissionError(f'Plan {plan_codigo} no permite backups automáticos')

    # Verificar límite de backups
    max_backups = limits['max_backups']
    if max_backups == 0:
        raise PermissionError(f'Plan {plan_codigo} no permite backups')

    if max_backups > 0:  # -1 = ilimitado
        # Contar backups activos en los últimos N días
        retencion_dias = limits['retencion_dias']
        fecha_limite = timezone.now() - timedelta(days=retencion_dias)

        count = TenantBackup.objects.filter(
            estado__in=['COMPLETADO', 'EN_PROGRESO', 'PENDIENTE'],
            creado_en__gte=fecha_limite,
        ).count()

        if count >= max_backups:
            raise PermissionError(
                f'Límite de {max_backups} backups alcanzado para plan {plan_codigo}'
            )

    return True


def validate_restore_permission(tenant):
    """
    Valida si el tenant puede restaurar backups.

    Args:
        tenant: Instancia de Tenant

    Raises:
        PermissionError: Si el tenant no puede restaurar
    """
    subscription = getattr(tenant, 'subscription', None)
    if not subscription or not subscription.esta_activa:
        raise PermissionError('No hay suscripción activa')

    plan_codigo = subscription.plan.codigo
    limits = get_plan_limits(plan_codigo)

    if not limits['permite_restore']:
        raise PermissionError(f'Plan {plan_codigo} no permite restaurar backups')

    return True


def validate_concurrent_restore(tenant):
    """
    Valida que no haya un restore en progreso para el tenant.

    Args:
        tenant: Instancia de Tenant

    Raises:
        PermissionError: Si ya hay un restore en progreso
    """
    in_progress = TenantBackup.objects.filter(
        estado='EN_PROGRESO',
    ).exists()

    if in_progress:
        raise PermissionError('Ya hay una operación de backup/restore en progreso')

    return True

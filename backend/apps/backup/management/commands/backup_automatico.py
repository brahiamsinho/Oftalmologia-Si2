"""
Management command: backup_automatico

Ejecuta backups automáticos para cada tenant según su configuración.
Se ejecuta cada hora vía cron o Docker scheduler.
Usa django-tenants schema context para ejecutar backups en cada schema.
"""
import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django_tenants.utils import tenant_context, get_tenant_model

from apps.backup.models import TenantBackup, TenantBackupConfig
from apps.backup.services import BackupService
from apps.backup.validators import validate_backup_limit
from apps.bitacora.models import AccionBitacora, Bitacora

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Ejecuta backups automáticos para cada tenant (America/La_Paz)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Ejecuta backup para todos los tenants sin verificar hora',
        )
        parser.add_argument(
            '--tenant-slug',
            type=str,
            help='Ejecuta backup solo para un tenant específico',
        )

    def handle(self, *args, **options):
        force = options['force']
        tenant_slug = options.get('tenant_slug')

        self.stdout.write(f'🔄 Iniciando backups automáticos (force={force})...')

        # Obtener todos los tenants
        Tenant = get_tenant_model()
        tenants = Tenant.objects.filter(activo=True)

        if tenant_slug:
            tenants = tenants.filter(slug=tenant_slug)
            if not tenants.exists():
                self.stderr.write(f'❌ Tenant "{tenant_slug}" no encontrado')
                return

        ahora = timezone.now()
        hora_actual = ahora.time().replace(second=0, microsecond=0)

        ejecutados = 0
        errores = 0

        for tenant in tenants:
            # Saltar schema public
            if tenant.schema_name == 'public':
                continue

            try:
                with tenant_context(tenant):
                    # Obtener configuración dentro del schema del tenant
                    config = TenantBackupConfig.objects.first()

                    if not config:
                        # Crear config por defecto
                        config = TenantBackupConfig.objects.create(
                            backup_automatico=True,
                            hora_backup='03:00:00',
                            frecuencia='daily',
                            retencion_dias=7,
                        )

                    # Verificar si está habilitado
                    if not config.backup_automatico:
                        continue

                    # Verificar hora (a menos que --force)
                    if not force:
                        config_hora = config.hora_backup
                        diff = abs(
                            (hora_actual.hour * 60 + hora_actual.minute) -
                            (config_hora.hour * 60 + config_hora.minute)
                        )
                        if diff > 1:
                            continue

                    # Verificar frecuencia semanal (solo ejecutar si es el día correcto)
                    if config.frecuencia == 'weekly' and ahora.weekday() != 6:  # Domingo
                        continue

                    self.stdout.write(f'  📦 Backup automático: {tenant.schema_name}')

                    # Validar límite por plan
                    try:
                        validate_backup_limit(tenant, is_automatic=True)
                    except PermissionError as e:
                        self.stdout.write(f'    ⏭️  Saltado: {e}')
                        continue

                    # Crear registro de backup
                    retencion = config.retencion_dias
                    expira_en = ahora + timedelta(days=retencion)

                    backup = TenantBackup.objects.create(
                        archivo='',  # Se actualiza después
                        tamaño_mb=0,
                        estado='EN_PROGRESO',
                        expira_en=expira_en,
                    )

                    # Ejecutar backup
                    try:
                        path, size = BackupService.create_backup(
                            tenant=tenant,
                            user=None,  # Automático
                        )

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
                            descripcion=f'Backup automático completado ({size:.2f} MB)',
                        )

                        self.stdout.write(f'    ✅ Completado: {path} ({size:.2f} MB)')
                        ejecutados += 1

                    except Exception as e:
                        backup.estado = 'FALLIDO'
                        backup.save()

                        Bitacora.objects.create(
                            modulo='BACKUP',
                            accion=AccionBitacora.CREAR,
                            tabla_afectada='tenant_backups',
                            id_registro_afectado=backup.pk,
                            descripcion=f'Backup automático fallido: {str(e)}',
                        )

                        self.stderr.write(f'    ❌ Fallido: {e}')
                        errores += 1

            except Exception as e:
                self.stderr.write(f'  ❌ Error en {tenant.schema_name}: {e}')
                errores += 1

        # Limpieza de backups expirados (en public schema)
        self._limpiar_expirados()

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Backups automáticos completados: {ejecutados} ejecutados, {errores} errores'
            )
        )

    def _limpiar_expirados(self):
        """Elimina registros de backups expirados y sus archivos."""
        # Esta función se ejecuta en el schema public
        # Necesita iterar por tenants para limpiar en cada schema
        Tenant = get_tenant_model()
        tenants = Tenant.objects.filter(activo=True)

        total_limpiados = 0

        for tenant in tenants:
            if tenant.schema_name == 'public':
                continue

            try:
                with tenant_context(tenant):
                    expirados = TenantBackup.objects.filter(
                        expira_en__lt=timezone.now(),
                        estado__in=['COMPLETADO', 'RESTAURADO'],
                    )

                    count = expirados.count()
                    if count > 0:
                        for backup in expirados:
                            try:
                                BackupService.delete_backup(backup)
                            except Exception as e:
                                self.stderr.write(f'  ⚠️  Error eliminando {backup.pk}: {e}')

                        expirados.update(estado='EXPIRADO')
                        total_limpiados += count
            except Exception as e:
                self.stderr.write(f'  ⚠️  Error limpiando {tenant.schema_name}: {e}')

        if total_limpiados > 0:
            self.stdout.write(f'  🧹 {total_limpiados} backups marcados como EXPIRADO')

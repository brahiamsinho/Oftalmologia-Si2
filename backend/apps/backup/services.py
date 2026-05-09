"""
apps/backup/services.py
Servicio de backup/restore usando pg_dump y psql nativos de PostgreSQL.
"""
import gzip
import logging
import os
import subprocess
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone

logger = logging.getLogger(__name__)


class BackupService:
    """
    Servicio para crear, restaurar y eliminar backups de tenants.

    Usa pg_dump y psql nativos de PostgreSQL para backups eficientes.
    Los backups se comprimen con gzip y se almacenan en el storage configurado.
    """

    @staticmethod
    def _get_db_config():
        """
        Obtiene la configuración de base de datos desde settings.

        Returns:
            dict con las variables de entorno para PostgreSQL
        """
        db_settings = settings.DATABASES['default']
        return {
            'PGHOST': db_settings.get('HOST', 'localhost'),
            'PGPORT': str(db_settings.get('PORT', '5432')),
            'PGUSER': db_settings.get('USER', ''),
            'PGPASSWORD': db_settings.get('PASSWORD', ''),
            'PGDATABASE': db_settings.get('NAME', ''),
        }

    @staticmethod
    def create_backup(tenant, user=None):
        """
        Crea un backup del schema de un tenant.

        Proceso:
        1. Ejecuta pg_dump --schema=<schema_name> para exportar solo el schema del tenant
        2. Comprime el resultado con gzip
        3. Guarda el archivo en storage

        Args:
            tenant: Instancia de Tenant (django_tenants)
            user: Usuario que solicita el backup (opcional)

        Returns:
            tuple: (ruta_archivo, tamaño_mb)

        Raises:
            Exception: Si pg_dump falla
        """
        schema = tenant.schema_name
        logger.info(f'Iniciando backup para schema: {schema}')

        # Configurar entorno para pg_dump
        env = {**os.environ, **BackupService._get_db_config()}

        # Nombre del archivo: backups/<tenant_id>/<timestamp>.sql.gz
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        storage_path = getattr(settings, 'BACKUP_STORAGE_PATH', 'backups')
        filename = f'{storage_path}/{tenant.id_tenant}/{timestamp}.sql.gz'

        # Comando pg_dump
        # --schema: solo el schema del tenant
        # --no-owner: no incluir comandos ALTER OWNER (para portabilidad)
        # --no-privileges: no incluir GRANT/REVOKE
        # --clean: incluir DROP antes de CREATE (para restore limpio)
        cmd = [
            'pg_dump',
            '--schema', schema,
            '--no-owner',
            '--no-privileges',
            '--clean',
            '--if-exists',
        ]

        timeout = getattr(settings, 'BACKUP_TIMEOUT_SECONDS', 600)

        try:
            # Ejecutar pg_dump
            proc = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            if proc.returncode != 0:
                error_msg = proc.stderr.strip() if proc.stderr else 'pg_dump failed with unknown error'
                logger.error(f'pg_dump error para {schema}: {error_msg}')
                raise Exception(f'pg_dump failed: {error_msg}')

            sql_output = proc.stdout

            if not sql_output.strip():
                raise Exception('pg_dump returned empty output')

            # Comprimir con gzip
            compressed = gzip.compress(sql_output.encode('utf-8'))

            # Validar tamaño máximo
            max_size_mb = getattr(settings, 'BACKUP_MAX_SIZE_MB', 500)
            size_mb = len(compressed) / (1024 * 1024)
            if size_mb > max_size_mb:
                raise Exception(f'Backup demasiado grande: {size_mb:.2f} MB (máx: {max_size_mb} MB)')

            # Guardar en storage
            content = ContentFile(compressed)
            path = default_storage.save(filename, content)

            logger.info(f'Backup guardado: {path} ({size_mb:.2f} MB)')
            return path, round(size_mb, 2)

        except subprocess.TimeoutExpired:
            logger.error(f'Timeout pg_dump para {schema} ({timeout}s)')
            raise Exception(f'Backup timeout after {timeout} seconds')
        except Exception as e:
            if 'pg_dump' in str(e):
                raise
            logger.error(f'Error inesperado en backup: {e}')
            raise Exception(f'Backup failed: {str(e)}')

    @staticmethod
    def restore_backup(backup, user, motivo='', tenant=None):
        """
        Restaura un backup específico.

        Proceso:
        1. Valida que el backup esté completado
        2. DROP SCHEMA CASCADE (elimina todo el schema actual)
        3. CREATE SCHEMA (recrea el schema vacío)
        4. psql < backup.sql (importa el backup)
        5. Verifica que las tablas críticas existan
        6. Actualiza metadata del backup

        Args:
            backup: Instancia de TenantBackup
            user: Usuario que solicita el restore
            motivo: Motivo de la restauración (para auditoría)

        Returns:
            bool: True si el restore fue exitoso

        Raises:
            Exception: Si el restore falla
        """
        from apps.backup.models import EstadoBackup

        if backup.estado not in [EstadoBackup.COMPLETADO, EstadoBackup.RESTAURADO]:
            raise Exception('Solo se pueden restaurar backups completados o previamente restaurados')

        target_tenant = tenant
        if target_tenant is None:
            # Fallback defensivo para escenarios legacy o llamados fuera de request.
            target_tenant = getattr(backup, 'tenant', None)

        if target_tenant is None or not getattr(target_tenant, 'schema_name', None):
            raise Exception('No se pudo resolver el tenant/schema para restaurar el backup')

        schema = target_tenant.schema_name
        logger.info(f'Iniciando restore para schema: {schema} desde backup {backup.pk}')

        # Configurar entorno
        env = {**os.environ, **BackupService._get_db_config()}
        timeout = getattr(settings, 'BACKUP_TIMEOUT_SECONDS', 600)

        try:
            # 1. DROP SCHEMA CASCADE
            logger.info(f'Dropping schema: {schema}')
            drop_proc = subprocess.run(
                ['psql', '-c', f'DROP SCHEMA IF EXISTS {schema} CASCADE'],
                env=env,
                capture_output=True,
                text=True,
                timeout=60,
            )

            if drop_proc.returncode != 0:
                logger.error(f'Error dropping schema: {drop_proc.stderr}')
                raise Exception(f'Failed to drop schema: {drop_proc.stderr}')

            # 2. CREATE SCHEMA
            logger.info(f'Creating schema: {schema}')
            create_proc = subprocess.run(
                ['psql', '-c', f'CREATE SCHEMA {schema}'],
                env=env,
                capture_output=True,
                text=True,
                timeout=60,
            )

            if create_proc.returncode != 0:
                logger.error(f'Error creating schema: {create_proc.stderr}')
                raise Exception(f'Failed to create schema: {create_proc.stderr}')

            # 3. Leer y descomprimir backup
            logger.info(f'Reading backup file: {backup.archivo}')
            try:
                backup_file = default_storage.open(backup.archivo)
                compressed_data = backup_file.read()
                backup_file.close()

                sql_content = gzip.decompress(compressed_data).decode('utf-8')
            except Exception as e:
                raise Exception(f'Failed to read/decompress backup: {str(e)}')

            # 4. Restaurar con psql
            logger.info(f'Restoring backup to schema: {schema}')
            restore_proc = subprocess.run(
                ['psql', '--set', f'schema={schema}'],
                input=sql_content,
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            if restore_proc.returncode != 0:
                logger.error(f'Error restoring backup: {restore_proc.stderr}')
                raise Exception(f'Restore failed: {restore_proc.stderr}')

            # 5. Verificar restore (contar tablas en el schema)
            verify_proc = subprocess.run(
                [
                    'psql', '-t', '-c',
                    f"SELECT count(*) FROM information_schema.tables WHERE table_schema = '{schema}';"
                ],
                env=env,
                capture_output=True,
                text=True,
                timeout=30,
            )

            if verify_proc.returncode == 0:
                table_count = int(verify_proc.stdout.strip())
                logger.info(f'Restore verificado: {table_count} tablas en schema {schema}')

                if table_count == 0:
                    logger.warning(f'WARNING: Schema {schema} tiene 0 tablas después del restore')

            # 6. Actualizar metadata
            backup.estado = EstadoBackup.RESTAURADO
            backup.restaurado_en = timezone.now()
            backup.restaurado_por = user
            backup.motivo_restore = motivo
            backup.save()

            logger.info(f'Restore completado exitosamente para {schema}')
            return True

        except subprocess.TimeoutExpired:
            logger.error(f'Timeout restore para {schema} ({timeout}s)')
            raise Exception(f'Restore timeout after {timeout} seconds')
        except Exception as e:
            if 'Restore failed' in str(e) or 'Failed' in str(e):
                raise
            logger.error(f'Error inesperado en restore: {e}')
            raise Exception(f'Restore failed: {str(e)}')

    @staticmethod
    def delete_backup(backup):
        """
        Elimina un backup del storage.

        Args:
            backup: Instancia de TenantBackup
        """
        try:
            if backup.archivo and default_storage.exists(backup.archivo):
                default_storage.delete(backup.archivo)
                logger.info(f'Backup eliminado del storage: {backup.archivo}')
        except Exception as e:
            logger.error(f'Error eliminando backup {backup.pk}: {e}')

    @staticmethod
    def get_backup_file(backup):
        """
        Obtiene el archivo de backup para descarga.

        Args:
            backup: Instancia de TenantBackup

        Returns:
            ContentFile: Archivo de backup
        """
        if not backup.archivo or not default_storage.exists(backup.archivo):
            raise Exception('Archivo de backup no encontrado')

        return default_storage.open(backup.archivo)

    @staticmethod
    def cleanup_expired_backups():
        """
        Elimina backups expirados del storage y actualiza su estado.

        Returns:
            int: Número de backups eliminados
        """
        from apps.backup.models import TenantBackup, EstadoBackup

        expirados = TenantBackup.objects.filter(
            expira_en__lt=timezone.now(),
            estado__in=[EstadoBackup.COMPLETADO, EstadoBackup.RESTAURADO],
        )

        count = 0
        for backup in expirados:
            try:
                BackupService.delete_backup(backup)
                backup.estado = EstadoBackup.EXPIRADO
                backup.save()
                count += 1
            except Exception as e:
                logger.error(f'Error limpiando backup {backup.pk}: {e}')

        logger.info(f'Limpieza completada: {count} backups expirados eliminados')
        return count

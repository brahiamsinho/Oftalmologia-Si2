"""
apps/backup/tests.py
Tests para el sistema de backup/restore.
"""
from datetime import time, timedelta
from contextlib import nullcontext
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from apps.backup.models import EstadoBackup, TenantBackup, TenantBackupConfig
from apps.backup.services import BackupService
from apps.backup.management.commands.backup_automatico import Command as BackupAutomaticoCommand
from apps.backup.validators import (
    validate_backup_limit,
    validate_concurrent_restore,
    validate_restore_permission,
)


class TenantBackupModelTest(TestCase):
    """Tests para el modelo TenantBackup."""

    def test_create_backup(self):
        """Test crear un backup."""
        backup = TenantBackup(
            archivo='backups/test/20260509_030000.sql.gz',
            tamaño_mb=5.50,
            estado=EstadoBackup.COMPLETADO,
            expira_en=timezone.now() + timedelta(days=7),
        )

        self.assertEqual(backup.estado, EstadoBackup.COMPLETADO)
        self.assertEqual(backup.tamaño_mb, 5.50)

    def test_backup_esta_vigente(self):
        """Test verificar si un backup está vigente."""
        backup = TenantBackup(
            archivo='backups/test/20260509_030000.sql.gz',
            tamaño_mb=5.50,
            estado=EstadoBackup.COMPLETADO,
            expira_en=timezone.now() + timedelta(days=7),
        )

        self.assertTrue(backup.esta_vigente)

    def test_backup_expirado(self):
        """Test verificar si un backup está expirado."""
        backup = TenantBackup(
            archivo='backups/test/20260509_030000.sql.gz',
            tamaño_mb=5.50,
            estado=EstadoBackup.COMPLETADO,
            expira_en=timezone.now() - timedelta(days=1),
        )

        self.assertFalse(backup.esta_vigente)

    def test_dias_restantes(self):
        """Test días restantes antes de expirar."""
        expira_en = timezone.now() + timedelta(days=5)
        backup = TenantBackup(
            archivo='backups/test/20260509_030000.sql.gz',
            tamaño_mb=5.50,
            estado=EstadoBackup.COMPLETADO,
            expira_en=expira_en,
        )

        self.assertGreaterEqual(backup.dias_restantes, 4)
        self.assertLessEqual(backup.dias_restantes, 5)


class TenantBackupConfigModelTest(TestCase):
    """Tests para el modelo TenantBackupConfig."""

    def test_create_config(self):
        """Test crear configuración de backup."""
        config = TenantBackupConfig(
            backup_automatico=True,
            hora_backup=time(3, 0),
            frecuencia='daily',
            retencion_dias=7,
        )

        self.assertTrue(config.backup_automatico)
        self.assertEqual(config.hora_backup, time(3, 0))
        self.assertEqual(config.frecuencia, 'daily')
        self.assertEqual(config.retencion_dias, 7)

    def test_default_values(self):
        """Test valores por defecto."""
        config = TenantBackupConfig()

        self.assertTrue(config.backup_automatico)
        self.assertEqual(config.hora_backup, time(3, 0))
        self.assertEqual(config.frecuencia, 'daily')
        self.assertEqual(config.retencion_dias, 7)


class BackupValidatorsTest(TestCase):
    """Tests para validadores de backup."""

    @patch('apps.backup.validators.getattr')
    def test_validate_backup_limit_no_subscription(self, mock_getattr):
        """Test validar límite sin suscripción."""
        mock_getattr.return_value = None

        tenant = MagicMock()
        tenant.subscription = None

        with self.assertRaises(PermissionError) as context:
            validate_backup_limit(tenant)

        self.assertIn('suscripción activa', str(context.exception))

    @patch('apps.backup.validators.TenantBackup.objects.filter')
    def test_validate_concurrent_restore_no_in_progress(self, mock_filter):
        """Test validar que no hay restore en progreso."""
        mock_filter.return_value.exists.return_value = False
        result = validate_concurrent_restore(MagicMock())
        self.assertTrue(result)

    @patch('apps.backup.validators.TenantBackup.objects.filter')
    def test_validate_concurrent_restore_in_progress(self, mock_filter):
        """Test validar restore cuando ya hay uno en progreso."""
        mock_filter.return_value.exists.return_value = True

        with self.assertRaises(PermissionError) as context:
            validate_concurrent_restore(MagicMock())

        self.assertIn('en progreso', str(context.exception))

    @override_settings(
        BACKUP_PLAN_LIMITS={
            'PLUS': {
                'max_backups': 5,
                'retencion_dias': 30,
                'permite_restore': True,
                'permite_automatico': True,
            }
        }
    )
    @patch('apps.backup.validators.TenantBackup.objects.filter')
    def test_validate_backup_limit_applies_retention_window(self, mock_filter):
        """Regresión: validar límite usa timedelta sin romper en runtime."""
        tenant = MagicMock()
        tenant.subscription = MagicMock(
            esta_activa=True,
            plan=MagicMock(codigo='PLUS'),
        )

        mock_qs = MagicMock()
        mock_qs.count.return_value = 0
        mock_filter.return_value = mock_qs

        result = validate_backup_limit(tenant)

        self.assertTrue(result)
        self.assertTrue(mock_filter.called)
        kwargs = mock_filter.call_args.kwargs
        self.assertIn('creado_en__gte', kwargs)
        self.assertIn('estado__in', kwargs)


class BackupServiceTest(TestCase):
    """Tests para el servicio de backup."""

    @patch('apps.backup.services.subprocess.run')
    @patch('apps.backup.services.default_storage')
    @patch('apps.backup.services.settings')
    def test_create_backup_success(self, mock_settings, mock_storage, mock_subprocess):
        """Test crear backup exitosamente."""
        # Mock settings
        mock_settings.DATABASES = {
            'default': {
                'HOST': 'localhost',
                'PORT': '5432',
                'USER': 'test_user',
                'PASSWORD': 'test_pass',
                'NAME': 'test_db',
            }
        }
        mock_settings.BACKUP_STORAGE_PATH = 'backups'
        mock_settings.BACKUP_MAX_SIZE_MB = 500
        mock_settings.BACKUP_TIMEOUT_SECONDS = 600

        # Mock subprocess
        mock_subprocess.return_value = MagicMock(
            returncode=0,
            stdout='CREATE TABLE test (id INT);',
            stderr='',
        )

        # Mock storage
        mock_storage.save.return_value = 'backups/1/20260509_030000.sql.gz'
        mock_storage.exists.return_value = True

        # Mock tenant
        tenant = MagicMock()
        tenant.schema_name = 'test_schema'
        tenant.id_tenant = 1

        # Ejecutar
        path, size = BackupService.create_backup(tenant)

        # Verificar
        self.assertEqual(path, 'backups/1/20260509_030000.sql.gz')
        self.assertGreaterEqual(size, 0)
        mock_subprocess.assert_called_once()

    @patch('apps.backup.services.subprocess.run')
    @patch('apps.backup.services.settings')
    def test_create_backup_pg_dump_fails(self, mock_settings, mock_subprocess):
        """Test crear backup cuando pg_dump falla."""
        # Mock settings
        mock_settings.DATABASES = {
            'default': {
                'HOST': 'localhost',
                'PORT': '5432',
                'USER': 'test_user',
                'PASSWORD': 'test_pass',
                'NAME': 'test_db',
            }
        }
        mock_settings.BACKUP_TIMEOUT_SECONDS = 600

        # Mock subprocess with error
        mock_subprocess.return_value = MagicMock(
            returncode=1,
            stdout='',
            stderr='pg_dump: error: connection failed',
        )

        # Mock tenant
        tenant = MagicMock()
        tenant.schema_name = 'test_schema'

        # Ejecutar y verificar error
        with self.assertRaises(Exception) as context:
            BackupService.create_backup(tenant)

        self.assertIn('pg_dump failed', str(context.exception))

    @patch('apps.backup.services.subprocess.run')
    @patch('apps.backup.services.default_storage')
    @patch('apps.backup.services.settings')
    def test_restore_backup_uses_explicit_tenant_without_backup_fk(
        self,
        mock_settings,
        mock_storage,
        mock_subprocess,
    ):
        """Regresión: restore funciona en modelos schema-local sin backup.tenant."""
        # Mock settings DB
        mock_settings.DATABASES = {
            'default': {
                'HOST': 'localhost',
                'PORT': '5432',
                'USER': 'test_user',
                'PASSWORD': 'test_pass',
                'NAME': 'test_db',
            }
        }
        mock_settings.BACKUP_TIMEOUT_SECONDS = 600

        # Mock archivo comprimido válido
        import gzip
        from io import BytesIO

        sql_bytes = b'CREATE TABLE ejemplo (id INT);'
        gz_data = gzip.compress(sql_bytes)
        file_mock = BytesIO(gz_data)
        mock_storage.open.return_value = file_mock

        # Mock subprocess sequence: drop/create/restore/verify
        mock_subprocess.side_effect = [
            MagicMock(returncode=0, stdout='', stderr=''),
            MagicMock(returncode=0, stdout='', stderr=''),
            MagicMock(returncode=0, stdout='', stderr=''),
            MagicMock(returncode=0, stdout='1\n', stderr=''),
        ]

        backup = MagicMock()
        backup.archivo = 'backups/test.sql.gz'
        backup.estado = EstadoBackup.COMPLETADO
        backup.pk = 99
        backup.save = MagicMock()

        tenant = MagicMock(schema_name='clinica_demo')
        user = MagicMock()

        result = BackupService.restore_backup(
            backup=backup,
            user=user,
            motivo='regresion',
            tenant=tenant,
        )

        self.assertTrue(result)
        self.assertEqual(backup.estado, EstadoBackup.RESTAURADO)
        backup.save.assert_called_once()


class BackupAutomaticoCommandTest(TestCase):
    """Tests del command backup_automatico con foco tenant_context."""

    @patch.object(BackupAutomaticoCommand, '_limpiar_expirados')
    @patch('apps.backup.management.commands.backup_automatico.Bitacora.objects.create')
    @patch('apps.backup.management.commands.backup_automatico.BackupService.create_backup')
    @patch('apps.backup.management.commands.backup_automatico.TenantBackup.objects.create')
    @patch('apps.backup.management.commands.backup_automatico.validate_backup_limit')
    @patch('apps.backup.management.commands.backup_automatico.TenantBackupConfig.objects.first')
    @patch('apps.backup.management.commands.backup_automatico.tenant_context')
    @patch('apps.backup.management.commands.backup_automatico.get_tenant_model')
    def test_handle_uses_tenant_context_for_active_tenant(
        self,
        mock_get_tenant_model,
        mock_tenant_context,
        mock_config_first,
        mock_validate_limit,
        mock_backup_create,
        mock_service_create,
        mock_bitacora_create,
        mock_cleanup,
    ):
        """Debe entrar en tenant_context para tenant no-public activo."""
        public_tenant = MagicMock(schema_name='public', slug='public', activo=True)
        active_tenant = MagicMock(schema_name='clinica_demo', slug='clinica-demo', activo=True)

        tenant_qs = [public_tenant, active_tenant]
        tenant_manager = MagicMock()
        tenant_manager.filter.return_value = tenant_qs
        tenant_model = MagicMock(objects=tenant_manager)
        mock_get_tenant_model.return_value = tenant_model

        config = MagicMock(
            backup_automatico=True,
            hora_backup=time(3, 0),
            frecuencia='daily',
            retencion_dias=7,
        )
        mock_config_first.return_value = config
        mock_tenant_context.side_effect = lambda tenant: nullcontext()

        backup_obj = MagicMock()
        mock_backup_create.return_value = backup_obj
        mock_service_create.return_value = ('backups/34/demo.sql.gz', 0.02)

        cmd = BackupAutomaticoCommand()
        cmd.handle(force=True, tenant_slug=None)

        mock_tenant_context.assert_called_once_with(active_tenant)
        mock_validate_limit.assert_called_once_with(active_tenant, is_automatic=True)
        self.assertTrue(mock_backup_create.called)
        self.assertTrue(mock_bitacora_create.called)
        mock_cleanup.assert_called_once()

    @patch.object(BackupAutomaticoCommand, '_limpiar_expirados')
    @patch('apps.backup.management.commands.backup_automatico.tenant_context')
    @patch('apps.backup.management.commands.backup_automatico.get_tenant_model')
    def test_handle_tenant_slug_not_found_skips_tenant_context(
        self,
        mock_get_tenant_model,
        mock_tenant_context,
        mock_cleanup,
    ):
        """Si tenant_slug no existe, no debe entrar en tenant_context."""
        empty_qs = MagicMock()
        empty_qs.exists.return_value = False

        base_qs = MagicMock()
        base_qs.filter.return_value = empty_qs

        tenant_manager = MagicMock()
        tenant_manager.filter.return_value = base_qs
        tenant_model = MagicMock(objects=tenant_manager)
        mock_get_tenant_model.return_value = tenant_model

        cmd = BackupAutomaticoCommand()
        cmd.handle(force=True, tenant_slug='no-existe')

        mock_tenant_context.assert_not_called()
        mock_cleanup.assert_not_called()

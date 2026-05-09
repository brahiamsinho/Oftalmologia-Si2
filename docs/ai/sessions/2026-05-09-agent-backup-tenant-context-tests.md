# Sesion: Backup tenant_context tests

## Fecha
2026-05-09

## Objetivo
Completar cobertura pendiente del scheduler de backup para contexto multi-tenant (`tenant_context`) y confirmar estado real de "100%" en backend backup.

## Cambios implementados
- `backend/apps/backup/tests.py`
  - Se agregó `BackupAutomaticoCommandTest` con 2 pruebas:
    1. `test_handle_uses_tenant_context_for_active_tenant`
       - verifica que el command use `tenant_context` para tenant activo no-public.
    2. `test_handle_tenant_slug_not_found_skips_tenant_context`
       - verifica salida temprana cuando `--tenant-slug` no existe.

## Validación ejecutada
- `docker compose exec backend python manage.py test apps.backup`
- Resultado: `OK (15 tests)`.

## Estado
- Backend backup: estable, smoke E2E validado y suite de módulo en verde.
- Pendiente externo al backend backup: panel frontend para gestión de backups.

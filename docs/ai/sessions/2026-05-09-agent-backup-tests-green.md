# Sesion: Backup tests green en django-tenants

## Fecha
2026-05-09

## Objetivo
Implementar plan de estabilización de pruebas de `apps.backup` y dejar suite en verde.

## Cambios
- `backend/apps/backup/views.py`
  - `BackupConfigViewSet.get_queryset()` ahora usa `order_by('id_config')` para ordenar paginación.

- `backend/apps/backup/tests.py`
  - Refactor de tests de modelos/config para validar propiedades sin persistencia obligatoria en tablas tenant.
  - Tests de concurrencia (`validate_concurrent_restore`) adaptados con mocks de queryset.
  - Regresión añadida: `validate_backup_limit` con ventana temporal (`creado_en__gte`).
  - Regresión añadida: `restore_backup` con tenant explícito y backup sin FK tenant.
  - Ajustes de aserciones no deterministas (size redondeado, días restantes por reloj).

## Validación
- Comando:
  - `docker compose exec backend python manage.py test apps.backup`
- Resultado:
  - `OK (13 tests)`

## Resultado
Suite del módulo backup estabilizada y verde en Docker, sin warning de orden inconsistente en `backup-config`.

## Pendientes
- Agregar 1-2 pruebas de integración real con `tenant_context` como capa adicional E2E para backup API.

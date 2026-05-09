# Sesion: Backup smoke test + fixes runtime

## Fecha
2026-05-09

## Objetivo
Continuar los siguientes pasos del sistema backup/restore multi-tenant y cerrar errores de runtime detectados en smoke test real.

## Verificaciones ejecutadas
- `docker compose ps`
- Login: `POST /t/clinica-demo/api/auth/login/`
- Diferencia de rutas detectada:
  - `.../api/organization/backup*` -> 404
  - `.../api/backup*` -> rutas vigentes
- `GET /t/clinica-demo/api/backup-config/`
- `POST /t/clinica-demo/api/organization/change-plan/` (plan `PLUS`)
- `POST /t/clinica-demo/api/backup/`
- `POST /t/clinica-demo/api/backup/{id}/restore/`
- `docker compose exec backend python manage.py backup_automatico --force --tenant-slug clinica-demo`

## Bugs encontrados y solucionados
1. **500 al crear backup manual**
   - Error: `NameError: name 'timedelta' is not defined`
   - Archivo: `backend/apps/backup/validators.py`
   - Fix: import `timedelta` desde `datetime`.

2. **500 al restaurar backup**
   - Error: `'TenantBackup' object has no attribute 'tenant'`
   - Archivos:
     - `backend/apps/backup/services.py`
     - `backend/apps/backup/views.py`
   - Fix:
     - `restore_backup(..., tenant=None)` ahora resuelve schema desde tenant explícito.
     - `restore()` pasa `tenant=request.tenant` al servicio.

## Resultado final
- Flujo confirmado:
  - backup manual creado (`estado=COMPLETADO`)
  - restore ejecutado (`mensaje=Backup restaurado exitosamente`, `estado=RESTAURADO`)
  - backup automático forzado ejecutado OK para `clinica-demo`

## Documentación ajustada
- `README.md`: ejemplos actualizados a rutas reales `.../api/backup*` y `.../api/backup-config/1/` para PATCH.
- `docs/api/backup.md`: endpoints corregidos (se removió prefijo incorrecto `organization` para backup app).

## Pendientes recomendados
- Agregar tests de regresión para:
  - import `timedelta` en validadores
  - restore schema-local sin FK `backup.tenant`
- Corregir warning DRF de paginación en `backup-config` (queryset ordenado explícitamente).

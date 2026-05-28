# Sesión 2026-05-28 - fix backup scheduler hora string

## Problema
En `backup-scheduler` aparecía error por tenant:

- `'str' object has no attribute 'hour'`

al comparar la hora actual con `config.hora_backup`.

## Causa
`hora_backup` podía llegar como `str` (legacy/datos previos) y el comando asumía siempre objeto `time`.

## Solución aplicada

### 1) Hardening en command

Archivo:
- `backend/apps/backup/management/commands/backup_automatico.py`

Cambios:
- nuevo helper `_normalize_backup_time(value)`:
  - acepta `time`,
  - parsea strings `HH:MM` y `HH:MM:SS`,
  - fallback a `03:00` con warning si inválido.
- creación default de `TenantBackupConfig` usa `hora_backup=time(3,0)` (en vez de string).
- comparación de hora usa valor normalizado.

### 2) Tests de regresión

Archivo:
- `backend/apps/backup/tests.py`

Tests agregados:
- parse de `03:15:00`,
- parse de `08:45`,
- fallback en string inválido.

## Validación

```bash
docker compose exec backend python manage.py test apps.backup
docker compose exec backend python manage.py backup_automatico --force
```

Resultados:
- `apps.backup`: **18 tests OK**
- backup automático forzado: **4 ejecutados, 0 errores**
- tenants FREE se saltan correctamente por política de plan.

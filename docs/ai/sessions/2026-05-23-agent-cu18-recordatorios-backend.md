# Sesión 2026-05-23 — CU18 Recordatorios (backend)

## Objetivo

Completar backend de **recordatorios automáticos** (CU18 / `apps.notificaciones.automatizaciones`).

## Implementado

### Modelo y migración `0003_cu18_recordatorio_cita`

- `TipoReglaRecordatorio.RECORDATORIO_CITA`
- FK `TareaRecordatorioProgramada.id_cita` → `citas.Cita`

### Servicios

- `services/scheduling.py` — programar/sync postoperatorio y cita; cancelar pendientes
- `services/processing.py` — `procesar_tarea_recordatorio` (push FCM + log) y lote `procesar_recordatorios_pendientes`

### Comando multi-tenant

- `procesar_recordatorios` recorre tenants activos con `tenant_context` (`--tenant-slug` opcional)

### Señales

- `post_save` en `Cita` y `Postoperatorio` → auto-programación

### Seeder

- `seeders/seed_recordatorios.py` — reglas por defecto 24h (postop + cita)
- Registrado en `manage.py seed` (`--only recordatorios`) y `entrypoint.sh`

### API

- `POST /api/notificaciones/tareas/generar/` acepta `id_cita` o `id_postoperatorio`

## Validación manual

```bash
python manage.py migrate_schemas
python manage.py seed --tenant clinica-demo --only recordatorios
python manage.py procesar_recordatorios --tenant-slug clinica-demo
```

## Pendiente

- UI web administración de reglas
- Servicio cron en `docker-compose` (similar a backup-scheduler)
- Tests pytest con `tenant_context` / schema de prueba (fixtures actuales chocan con django-tenants)

## Archivos clave

- `backend/apps/notificaciones/automatizaciones/`
- `backend/seeders/seed_recordatorios.py`

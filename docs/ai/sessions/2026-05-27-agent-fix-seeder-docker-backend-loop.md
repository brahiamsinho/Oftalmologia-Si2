# Sesión: fix seeder demo + backend Docker en bucle

**Fecha:** 2026-05-27  
**Problema:** `docker compose up` — backend reiniciaba en bucle; mailhog/db/frontend OK.

## Causa
`seed_demo_paciente` usaba `get_or_create(usuario=...)` y `generar_numero_historia()` en `defaults`. Tras borrar pacientes y restaurar backups, el usuario demo existía sin paciente, el seeder generaba `HC-2026-000019` ya ocupado → `IntegrityError` → entrypoint abortaba (`set -e`).

## Cambios
- `backend/seeders/seed_demo_paciente.py`: lookup por `numero_documento=DEMO-BRANDON-001`, historia fija `HC-DEMO-BRANDON`.
- `backend/entrypoint.sh`: try/except en `run_seed` para no tumbar el arranque si un seeder opcional falla.

## Verificación
Backend llega a `Starting development server at http://0.0.0.0:8000/`.  
`seed_reporting_6months` puede advertir duplicado de historia; no bloquea.

## Pendiente
Idempotencia de `seed_reporting_6months` y migración pendiente `platform_admin`.

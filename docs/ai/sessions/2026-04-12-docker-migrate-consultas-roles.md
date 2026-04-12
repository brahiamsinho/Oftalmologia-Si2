# Sesión 2026-04-12 — migrate en Docker, consultas, roles/permisos UI

## Objetivo
Cerrar huecos reportados con logs: BD sin migrar, permisos vacíos en modal de rol, consulta sin lugar visible en UI, lógica consulta↔cita, feedback al registrar paciente.

## Cambios
- `backend/entrypoint.sh`: `python manage.py migrate --noinput` tras esperar Postgres.
- `ConsultaSerializer.validate`: paciente y cita deben corresponder; soporta PATCH usando `instance`.
- `ConsultaViewSet.perform_create`: si hay cita, pasa a `ATENDIDA` desde PROGRAMADA/CONFIRMADA/REPROGRAMADA (transacción atómica).
- Frontend: `/consultas`, sidebar, breadcrumb; `registrar-consulta` sincroniza cita/paciente y redirige a `/consultas`; roles `activo !== false`; permisos pantalla coherente; modal paciente `_general`; `fetchAll` normaliza `next`.

## Notas
- Seed (`python manage.py seed`) no se ejecuta en el entrypoint por decisión de no sobrescribir datos en cada arranque.

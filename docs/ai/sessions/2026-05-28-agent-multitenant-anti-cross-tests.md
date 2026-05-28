# Sesion 2026-05-28 - hardening multi-tenant anti-cruce

## Objetivo
Implementar validaciones automatizadas para garantizar aislamiento de datos entre dos clinicas (tenants) y evitar cruces.

## Cambios realizados

- Nuevo archivo de pruebas:
  - `backend/apps/tenant/tests/test_multitenant_isolation.py`
- Se crean dos tenants de prueba (`tenant_iso_a`, `tenant_iso_b`) con schemas independientes.
- Se siembran datos minimos por tenant:
  - `Usuario` admin/medico/paciente
  - `Especialista`
  - `Paciente`
  - `TipoCita` + `Cita`
  - `Consulta`
- Se validan 3 casos de aislamiento:
  1. En schema A no aparecen `numero_documento` de pacientes del schema B.
  2. En schema A no aparecen pacientes de citas del schema B.
  3. En schema A no aparecen motivos de consultas del schema B.

## Verificacion ejecutada

```bash
docker compose exec backend pytest apps/tenant/tests/test_multitenant_isolation.py -q
```

Resultado:

- `3 passed in 23.72s`

## Hallazgos

- En este entorno de tests, los endpoints HTTP tenant (`/t/<slug>/api/...`) devolvian `404`.
- Para no bloquear el hardening, se implemento validacion directa por schema/ORM (la barrera de seguridad principal en arquitectura `django-tenants`).

## Siguiente paso recomendado

- Ajustar configuracion de pytest + middleware/URL tenant para poder correr tambien pruebas de aislamiento a nivel HTTP (`/t/<slug>/api/...`) y cubrir capa request-routing ademas de capa DB.

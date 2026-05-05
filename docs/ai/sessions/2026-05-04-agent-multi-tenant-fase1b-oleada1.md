# Session: Fase 1b multi-tenant primera ola

## Goal
Tenantizar de forma segura las raíces críticas del backend bajo Opción A sin romper login ni endpoints existentes.

## Discoveries
- La capa de auth pública sigue bypassing el middleware de tenant, así que forzar `NOT NULL` hoy sería un corte innecesario.
- Las raíces más seguras para empezar son `Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora`, `Notificacion`, `DispositivoFcm` y `Especialista`.
- El scoping mínimo por tenant puede activarse en listados sin cambiar contratos de escritura todavía.

## Accomplished
- ✅ Agregadas FK nullable a `Tenant` en las raíces críticas.
- ✅ Implementado backfill a `legacy` en migraciones nuevas.
- ✅ Añadido scoping mínimo por tenant en listados de usuarios, pacientes, historias, bitácora y especialistas.
- ✅ Creado test de aislamiento cross-tenant para `Paciente`.

## Relevant Files
- `backend/apps/tenant/utils.py` — resolución server-side de tenant para escrituras.
- `backend/apps/tenant/managers.py` — queryset con `for_tenant()`.
- `backend/apps/pacientes/pacientes/tests/test_tenant_scoping.py` — prueba de aislamiento básica.
- `docs/ai/DECISIONS_LOG.md` — decisión de no forzar `NOT NULL` todavía.

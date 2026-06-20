# Session 2026-06-20 — CU24 clasificador de urgencia

## Goal
Implementar CU24 para clasificar formalmente la urgencia detectada por el asistente virtual del paciente.

## Instructions
- Respetar la arquitectura modular del monorepo.
- Mantener CU23 como detector y CU24 como clasificador formal explicable.
- Actualizar memoria viva de `docs/ai/` después de la implementacion.

## Discoveries
- CU23 ya dejaba un flag de urgencia y un nivel preliminar, pero no existia un clasificador formal persistido.
- El backend corre en django-tenants, asi que los tests de apps tenant requieren `schema_context` y un tenant de prueba.
- `pytest` en Docker aplica migraciones del schema tenant automaticamente, pero la app nueva necesitaba usar el label real `inteligencia_artificial` en la migracion.

## Accomplished
- ✅ Se agrego `ClasificacionUrgencia` con score, nivel, factores, recomendacion y trazabilidad por interaccion.
- ✅ Se implemento `ClasificadorUrgenciaService` con scoring deterministico explicable.
- ✅ CU23 ahora autogenera la clasificacion cuando detecta urgencia.
- ✅ Se expusieron endpoints de staff para listar, filtrar y revisar clasificaciones.
- ✅ Se actualizaron frontend, docs/ai y `PACKAGE_CU_MAP.md` para reflejar CU24.
- ✅ Se agregaron tests y se valido con `manage.py check`, `pytest` y `npm run lint`.

## Next Steps
- Implementar CU25 para derivar casos criticos a personal humano usando la clasificacion CU24.
- Evaluar si el frontend necesita un panel dedicado para revisiones de urgencia por staff.

## Relevant Files
- backend/apps/InteligenciaArtificial/models.py — modelos de interaccion y clasificacion de urgencia.
- backend/apps/InteligenciaArtificial/services/clasificador_urgencia.py — scoring y persistencia CU24.
- backend/apps/InteligenciaArtificial/views.py — auto-clasificacion y endpoints staff.
- backend/apps/InteligenciaArtificial/tests/test_clasificador_urgencia.py — cobertura de CU24.
- frontend/src/app/(dashboard)/InteligenciaArtificial/page.tsx — badge visual de CU24.
- frontend/src/services/iaService.ts — tipos del contrato de clasificacion.
- docs/ai/PACKAGE_CU_MAP.md — trazabilidad CU23-CU25.

# Sesion 2026-06-18 - CU25 derivacion critica automatica

## Objetivo

Automatizar la derivacion humana critica para que CU24 cree el handoff sin accion manual cuando el caso es `CRITICO`.

## Instructions

- Mantener la clasificacion CU24 deterministica.
- Reutilizar la derivacion manual existente como fallback, no reemplazarla todavia.
- Evitar duplicados: si ya existe un handoff para esa clasificacion, reutilizarlo.

## Discoveries

- La derivacion humana estaba implementada pero era manual, via `POST /t/<slug>/api/ia/human-handoffs/from-classification/<id>/`.
- CU23 ya crea clasificaciones criticas; el paso faltante era enganchar el handoff automatico al persistir la clasificacion.
- `notify_available_staff(...)` ya resuelve la notificacion y actualiza el estado del handoff cuando hay staff disponible.

## Accomplished

- ✅ Se agrego `ensure_handoff_for_classification(...)` en `backend/apps/ia/services/human_handoff.py`.
- ✅ Se conecto la automatizacion en `backend/apps/ia/views.py` al endpoint CU24.
- ✅ Se conecto la automatizacion en `backend/apps/InteligenciaArtificial/views.py` para el puente CU23 -> CU24.
- ✅ Se agregaron tests de regresion para confirmar que el handoff se crea automaticamente.
- ✅ Se actualizo `docs/ai/` con estado, handoff y decision arquitectonica.

## Next Steps

- Validar el flujo automatico en Docker con un caso critico real.
- Confirmar que no se duplican handoffs ante reintentos.
- Si hace falta, exponer mejor el estado del handoff en la respuesta API.

## Relevant Files

- `backend/apps/ia/services/human_handoff.py` - helper automatico.
- `backend/apps/ia/views.py` - CU24 ahora dispara la derivacion.
- `backend/apps/InteligenciaArtificial/views.py` - puente CU23 -> CU24 con derivacion automatica.
- `backend/apps/ia/tests/test_urgency_classification_api.py` - cobertura del auto handoff en CU24.
- `backend/apps/InteligenciaArtificial/tests/test_asistente_virtual.py` - cobertura del puente CU23.

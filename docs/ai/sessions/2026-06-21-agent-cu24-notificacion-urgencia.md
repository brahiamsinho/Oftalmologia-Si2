## Goal
Restaurar la notificación al staff cuando el asistente virtual del paciente detecta una urgencia en CU23/CU24.

## Instructions
- Mantener la arquitectura tenant-aware existente.
- No exponer siglas técnicas al paciente.
- Reutilizar el sistema de notificaciones persistentes ya existente.

## Discoveries
- El flujo `apps.InteligenciaArtificial` clasificaba la urgencia pero no notificaba al staff.
- La urgencia media se perdía aunque el paciente veía la tarjeta de clasificación.
- El chatbot CU25 seguía notificando, pero no cubría este flujo legacy de paciente.

## Accomplished
- ✅ Se agregó notificación persistente para `requiere_clasificacion_urgencia` en `backend/apps/InteligenciaArtificial/views.py`.
- ✅ Se diferenció `clasificacion_urgencia` para casos medios y `derivacion_urgente` para altas/críticas.
- ✅ Se añadió una prueba de regresión en `backend/apps/InteligenciaArtificial/tests/test_clasificador_urgencia.py`.
- ✅ Se actualizó la memoria viva en `docs/ai/`.

## Next Steps
- Validar manualmente el flujo desde móvil con un caso de urgencia media y confirmar que aparece en `/notificaciones`.
- Si hace falta, ajustar el copy de la tarjeta para que el staff identifique mejor el nivel medio.

## Relevant Files
- backend/apps/InteligenciaArtificial/views.py — dispara las notificaciones de urgencia.
- backend/apps/InteligenciaArtificial/tests/test_clasificador_urgencia.py — prueba de regresión.
- backend/apps/crm/notificaciones/services.py — persistencia y envío FCM.

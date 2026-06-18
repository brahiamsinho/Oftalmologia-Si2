# Sesion 2026-06-18 - CU23 hibrido con Gemini y historial

## Objetivo

Convertir el asistente virtual de Paciente en un flujo hibrido: reglas deterministicas para seguridad clinica y Gemini solo para reformular respuestas no criticas, usando el historial real de `id_conversacion`.

## Instructions

- Mantener CU23 seguro: urgencias deterministicas primero.
- No usar Gemini para decidir urgencias ni para inventar datos.
- Reutilizar el cliente Gemini existente si aporta valor, no duplicarlo.
- Actualizar la memoria viva del proyecto despues de cambios importantes.

## Discoveries

- `backend/apps/InteligenciaArtificial/views.py` ya guardaba `id_conversacion`, pero no estaba reconstruyendo el historial para alimentar la respuesta.
- `backend/apps/ia/services/chatbot.py` era reutilizable; basto con generalizar el `system_instruction` para no crear otro cliente Gemini.
- El fallback seguro debe devolver la respuesta base validada si Gemini falla o no responde.

## Accomplished

- ✅ Se extendio `AsistenteVirtualService` para reformular respuestas no criticas con Gemini y conservar la respuesta base segura si falla.
- ✅ Se agrego reconstruccion del historial desde `id_conversacion` en la vista del asistente virtual.
- ✅ Se generalizo `GeminiChatbotAssistant` para aceptar `system_instruction`.
- ✅ Se agregaron tests para rewrite Gemini, fallback seguro e historial de conversacion.
- ✅ Se actualizo memoria viva del proyecto en `docs/ai/`.

## Next Steps

- Validar el flujo en Docker cuando este disponible.
- Probar manualmente el asistente de paciente con una cuenta `PACIENTE` y varias interacciones en la misma conversacion.
- Confirmar que las respuestas no criticas suenan mas naturales sin cambiar el sentido.

## Relevant Files

- `backend/apps/InteligenciaArtificial/services/asistente_virtual.py` - motor CU23 hibrido.
- `backend/apps/InteligenciaArtificial/views.py` - reconstruye el historial y persiste la interaccion.
- `backend/apps/ia/services/chatbot.py` - cliente Gemini reutilizable.
- `backend/apps/InteligenciaArtificial/tests/test_asistente_virtual.py` - cobertura del nuevo flujo.
- `docs/ai/CURRENT_STATE.md` - estado actual del proyecto.
- `docs/ai/HANDOFF_LATEST.md` - resumen para continuidad.
- `docs/ai/DECISIONS_LOG.md` - decision de arquitectura sobre el modo hibrido.

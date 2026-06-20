# Session 2026-06-20 — UX paciente sin siglas CU

## Goal
- Quitar siglas tecnicas visibles al paciente en el asistente virtual mobile.

## Discoveries
- La respuesta del backend estaba mencionando `CU24` en texto visible.
- La tarjeta mobile tambien estaba mostrando `CU24` como parte del titulo de urgencia.

## Accomplished
- Se reemplazaron las siglas visibles por lenguaje clinico natural.
- Se actualizo la memoria del proyecto para reflejar la decision de UX.

## Next Steps
- Reprobar la pantalla del asistente con una consulta de riesgo.
- Confirmar que el texto queda entendible para paciente sin etiquetas tecnicas.

## Relevant Files
- `backend/apps/InteligenciaArtificial/services/asistente_virtual.py`
- `mobile/lib/features/ia/presentation/screens/patient_virtual_assistant_screen.dart`
- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/DECISIONS_LOG.md`

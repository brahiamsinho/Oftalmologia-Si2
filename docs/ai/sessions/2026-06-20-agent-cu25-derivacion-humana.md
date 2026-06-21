# Sesión 2026-06-20 — CU25 derivación de casos críticos

## Contexto

- CU23 ya existía en `backend/apps/ia/` con chatbot Gemini.
- El sistema de notificaciones persistentes ya estaba resuelto en `apps.crm.notificaciones`.
- Faltaba derivar casos urgentes del chatbot a staff humano sin crear una nueva app.

## Implementación

- Nuevo detector backend en `backend/apps/ia/services/derivation.py`.
- `ChatbotMessageView` ahora devuelve `derivacion` y dispara notificaciones persistentes + bitácora.
- `backend/apps/bitacora/models.py` sumó la acción `DERIVAR`.
- Frontend:
  - `frontend/src/app/(dashboard)/notificaciones/page.tsx` ahora consume la API real.
  - `frontend/src/app/(dashboard)/(gestion-ia)/asistente-virtual/page.tsx` muestra alerta humana simple cuando se deriva.
  - `frontend/src/services/iaService.ts` y `frontend/src/hooks/useVirtualAssistantChat.ts` exponen el estado de derivación.

## Verificación

1. `docker compose exec backend pytest apps/ia/tests/test_chatbot_derivation.py`
2. `docker compose exec frontend npx eslint "src/app/(dashboard)/(gestion-ia)/asistente-virtual/page.tsx" "src/app/(dashboard)/notificaciones/page.tsx" "src/hooks/useVirtualAssistantChat.ts" "src/services/iaService.ts"`

## Observaciones

- La derivación se apoyó en heurísticas explícitas de signos de alarma para evitar crear otra capa de persistencia.
- Los textos visibles al usuario quedaron en español simple, sin siglas técnicas.

# Sesion 2026-05-28 — Asistente virtual (copy + prompt oftalmológico)

## Solicitud

Eliminar en la UI:
- `Modelo activo: gemini-2.5-flash`
- `CU23`

Y mejorar el prompt del asistente para una clínica oftalmológica.

## Cambios implementados

### Frontend

Archivo: `frontend/src/app/(dashboard)/(gestion-ia)/asistente-virtual/page.tsx`

- Se removió la etiqueta `Chat CU23`.
- Se removió la línea de modelo activo.
- Se reemplazó por copy neutral y profesional:
  - "Asistente de apoyo clínico y administrativo"
  - "Orientado a la operación diaria de oftalmología."
- Se actualizó el texto descriptivo principal de la pantalla.
- Se mejoró el estado vacío con ejemplo más contextual.
- Se mejoró el placeholder de entrada con ejemplos reales de uso clínico-operativo.

### Backend

Archivo: `backend/apps/ia/services/chatbot.py`

- Se reforzó `_CHATBOT_SYSTEM_PROMPT` con:
  - foco en operaciones de clínica oftalmológica,
  - agenda, flujo de atención, seguros/facturación y reportes,
  - reglas de seguridad ante síntomas de alarma,
  - límites clínicos (sin diagnóstico definitivo ni prescripción),
  - solicitud de contexto mínimo antes de recomendar acciones.

## Validación

- `ReadLints` sobre archivos modificados: sin errores.


# Sesión 2026-05-30 — Mobile asistente virtual (chatbot)

## Contexto

- `main` (2026-05-28) ya tenía: backend `ia/chatbot/`, web `/asistente-virtual`, mobile **reportes** en `features/reportes/`.
- Faltaba: mobile **chatbot conversacional** (no otro módulo de reportes QBE).

## Implementación

- Rama: `orlando-hace-algo-chatbot-mobile` (desde `main` tras `git pull origin main`).
- `mobile/lib/features/ia/`: chat contra `POST ia/chatbot/`.
- Ruta `/asistente-virtual`, tarjeta en dashboard staff.
- Roles: ADMIN, ADMINISTRATIVO, MEDICO, ESPECIALISTA.

## Probar

1. Staff logueado + tenant en workspace.
2. Inicio → **Asistente virtual** o `/asistente-virtual`.
3. Enviar mensaje; ver respuesta del asistente.
4. **Limpiar chat** en AppBar.
5. PACIENTE → pantalla de acceso restringido.

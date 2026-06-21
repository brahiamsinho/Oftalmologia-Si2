# Sesión 2026-06-21 — CU25 polling web de notificaciones

## Contexto

- Faltaba refresco automático en la campana/header y en `/notificaciones` para ver derivaciones críticas sin recargar manualmente.
- Se pidió mantener el cambio mínimo y evitar websockets/push real.

## Implementación

- `frontend/src/components/layout/Header.tsx` ahora mantiene el estado único de notificaciones para el badge y el dropdown, y hace polling silencioso cada 20s.
- `frontend/src/app/(dashboard)/notificaciones/page.tsx` también refresca cada 20s mientras está montada.
- Ambos flujos limpian el intervalo al desmontar y preservan marcar como leída / marcar todas.

## Observaciones

- Se priorizó polling ligero con una sola fuente de verdad en el header para evitar requests duplicados entre badge y dropdown.
- El header ignora fallos de red; la página conserva su error visible actual cuando falla la carga manual.

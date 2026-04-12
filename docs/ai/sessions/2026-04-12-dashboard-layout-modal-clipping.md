# Sesión 2026-04-12 — Recorte vertical en dashboard / modal Pacientes

## Problema
Contenido del área principal y modal “Registrar paciente” recortados a la misma altura (sidebar completo).

## Causa
1. Cadena flex (`h-screen` + `overflow-hidden`) sin `min-h-0` en la columna derecha y en `<main>`: el ítem flex no podía encogerse y el padre recortaba con `overflow-hidden`.
2. Modal `fixed` dentro de `<main class="overflow-y-auto">`: el overlay podía quedar acotado al scrollport y verse recortado junto al contenido.

## Cambios
- `frontend/src/app/(dashboard)/layout.tsx`: wrapper `flex-1` → `min-h-0 overflow-hidden`; `<main>` → `min-h-0 flex-1 overflow-y-auto`.
- `frontend/src/app/(dashboard)/(gestion-pacientes)/pacientes/page.tsx`: `PacienteModal` con `createPortal` a `document.body`.

## Referencia
`docs/ai/CURRENT_STATE.md` (Frontend).

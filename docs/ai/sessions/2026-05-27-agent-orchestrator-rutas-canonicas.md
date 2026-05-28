# Sesion 2026-05-27 - Orchestrator rutas canonicas

## Objetivo

Dejar explicitas las rutas reales del monorepo para que el subagente `orchestrator` delegue tareas sin ambiguedad.

## Cambios aplicados

- Archivo actualizado: `.cursor/agents/orchestrator.md`
  - Seccion agregada: `Project Roots (Canonical)`.
  - Rutas fijadas:
    - `.../backend`
    - `.../frontend`
    - `.../mobile`
    - `.../docs`
  - Nota operativa: usar estas rutas como source of truth.

## Memoria actualizada

- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`

## Impacto

- Menor riesgo de delegar analisis/implementacion en carpeta equivocada.
- Mayor consistencia entre sesiones de agentes y handoffs.

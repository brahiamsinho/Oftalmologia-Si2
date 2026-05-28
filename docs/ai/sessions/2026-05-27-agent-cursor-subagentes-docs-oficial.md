# Sesion 2026-05-27 - Cursor subagentes segun doc oficial

## Objetivo

Reordenar `.cursor` para alinearlo con la documentacion oficial de Cursor sobre subagentes y rules.

## Cambios aplicados

- Se eliminaron rules duplicadas por rol:
  - `.cursor/rules/agent-*.mdc`
- Se dejo `rules` solo para politica/routing:
  - `.cursor/rules/00-core-policy.mdc`
  - `.cursor/rules/10-routing-hints.mdc`
  - `.cursor/rules/README.md` actualizado
- Se implementaron subagentes reales en `.cursor/agents/`:
  - `orchestrator.md`
  - `backend.md`
  - `frontend.md`
  - `mobile.md`
  - `ui-ux.md`
  - `architecture.md`
  - `architect-planner.md`
  - `code-review.md`
  - `qa-testing.md`
  - `devops.md`
  - `infra.md`
- Se actualizo:
  - `.cursor/agents/README.md`

## Memoria actualizada

- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/DECISIONS_LOG.md`

## Nota de continuidad

Se mantiene compatibilidad OpenCode en `.opencode/agents/`, pero la operacion en Cursor queda normalizada en:

- Subagentes: `.cursor/agents/`
- Politicas/routing: `.cursor/rules/`

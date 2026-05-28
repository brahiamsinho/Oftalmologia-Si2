# Sesion 2026-05-27 - Migracion OpenCode a Cursor subagentes

## Objetivo

Transformar la capa de agentes OpenCode a una capa equivalente operable desde Cursor usando reglas tipo `@agent-*`, manteniendo continuidad con la memoria del proyecto (`docs/ai`) y `AGENTS.md`.

## Cambios aplicados

- Creada estructura Cursor:
  - `.cursor/rules/README.md`
  - `.cursor/rules/agent-orchestrator.mdc`
  - `.cursor/rules/agent-backend.mdc`
  - `.cursor/rules/agent-frontend.mdc`
  - `.cursor/rules/agent-mobile.mdc`
  - `.cursor/rules/agent-ui-ux.mdc`
  - `.cursor/rules/agent-architecture.mdc`
  - `.cursor/rules/agent-architect-planner.mdc`
  - `.cursor/rules/agent-code-review.mdc`
  - `.cursor/rules/agent-qa-testing.mdc`
  - `.cursor/rules/agent-devops.mdc`
  - `.cursor/rules/agent-infra.mdc`
- Agregado puntero:
  - `.cursor/agents/README.md`
- Corregido conflicto de merge en:
  - `.opencode/README.md`

## Memoria actualizada

- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/DECISIONS_LOG.md`
- `docs/ai/SKILLS_REGISTRY.md`
- `docs/ai/PROMPTS_LIBRARY.md`

## Resultado operativo

- OpenCode sigue funcionando con `.opencode/agents/`.
- Cursor ya puede usar roles equivalentes con menciones `@agent-*`.
- Queda definido un puente estable OpenCode <-> Cursor sin perder contexto histórico.

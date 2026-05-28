# Cursor Subagents

This project uses real Cursor subagents in `.cursor/agents/`.

Available subagents:
- `orchestrator`
- `backend`
- `frontend`
- `mobile`
- `ui-ux`
- `architecture`
- `architect-planner`
- `code-review`
- `qa-testing`
- `devops`
- `infra`

Recommended usage:
- Delegate to these subagents for execution specialization.
- Keep cross-cutting policy in `.cursor/rules/`.
- Keep OpenCode compatibility in `.opencode/agents/`.

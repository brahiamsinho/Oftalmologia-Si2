---
description: Update docs/ai memory after meaningful project changes.
agent: orchestrator
---

Use a todo list because memory updates touch multiple files and must stay consistent.

Update the live project memory in `docs/ai/` for the work just completed: $ARGUMENTS

Required reads:
- `AGENTS.md`
- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/DECISIONS_LOG.md`

Required updates when appropriate:
- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/DECISIONS_LOG.md` if a durable technical decision was made
- `docs/ai/SKILLS_REGISTRY.md` if skills changed
- `docs/ai/PROMPTS_LIBRARY.md` if reusable commands/prompts changed
- a new session file under `docs/ai/sessions/YYYY-MM-DD-agent-resumen-corto.md`

Rules:
- Keep updates concise and useful for the next agent.
- Do not invent completed work; only record what actually changed.
- Preserve PUDS traceability when relevant.
- Do not include secrets, tokens, IP-specific production values, or credentials.

Deliver:
- Files updated.
- What changed in memory.
- Any remaining next steps.

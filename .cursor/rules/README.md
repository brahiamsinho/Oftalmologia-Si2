---
description: Cursor rules index for policy and routing.
alwaysApply: false
---

# Cursor Rules

This project uses:
- Real subagents in `.cursor/agents/` for execution specialization.
- Rules in `.cursor/rules/` for shared policy and routing behavior.

Current rules:
- `00-core-policy.mdc` (always apply)
- `10-routing-hints.mdc` (optional routing guide)

Subagents live in:
- `.cursor/agents/README.md`

Memory policy:
- Read `AGENTS.md` and key `docs/ai/*` context before meaningful changes.
- After meaningful changes update at least:
  - `docs/ai/CURRENT_STATE.md`
  - `docs/ai/HANDOFF_LATEST.md`
  - `docs/ai/NEXT_STEPS.md`
  - `docs/ai/sessions/YYYY-MM-DD-agent-*.md`

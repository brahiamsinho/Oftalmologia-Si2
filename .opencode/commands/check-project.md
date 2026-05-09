---
description: Review project health, OpenCode setup, git state, and AI memory without changing code.
agent: orchestrator
---

Use a todo list because this is a multi-step project check.

Review the current workspace health for Oftalmologia Si2.

Scope:
- Read `AGENTS.md` and the key files in `docs/ai/` first.
- Check OpenCode project configuration under `.opencode/`.
- Check available project skills and workspace skills.
- Check git status without modifying or staging files.
- Identify risks, missing memory updates, stale handoff notes, or architecture drift.

Rules:
- Do not edit files unless the user explicitly asks after the check.
- Do not read real `.env` or credential files.
- Do not run destructive git commands.
- Keep findings factual and based on files/configuration that exist.

Deliver:
- Current health summary.
- OpenCode agents/commands/skills/plugins status.
- Git working tree summary.
- Risks or inconsistencies.
- Recommended next actions.

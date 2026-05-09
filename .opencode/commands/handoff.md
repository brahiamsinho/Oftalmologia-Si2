---
description: Produce a concise continuation handoff for the next agent or session.
agent: orchestrator
---

Use a todo list if the handoff requires checking several files or recent changes.

Create a handoff for the current work/session: $ARGUMENTS

Include:
- Goal.
- What was changed.
- Files touched.
- Commands/tests run and their result.
- Decisions made.
- Risks/blockers.
- Next recommended actions.
- Any memory files that still need updates.

Rules:
- Be factual and concise.
- Do not include secrets.
- If the handoff should persist, update `docs/ai/HANDOFF_LATEST.md` and create a session file only when the user asks or when this follows a meaningful project change.

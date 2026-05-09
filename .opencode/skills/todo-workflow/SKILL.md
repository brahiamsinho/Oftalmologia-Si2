---
name: todo-workflow
description: Use structured todo lists for multi-step work, keeping one active item, immediate completion updates, validation, and memory follow-up.
license: MIT
compatibility: opencode
metadata:
  project: oftalmologia-si2
  workflow: productivity
---

# Todo Workflow Skill

Use this skill when a task has multiple steps, touches several files, spans backend/frontend/mobile/infra/docs, requires validation, or updates `docs/ai/`.

## When To Use Todos

Use a todo list when:
- The task has 3 or more meaningful steps.
- The task touches more than one layer or module.
- The task includes implementation plus tests/validation.
- The task requires `docs/ai/` memory updates.
- The user explicitly asks for organized tracking.

Skip todos when:
- The task is a one-line answer.
- The task is a single command with no follow-up.
- The task is purely conversational.

## Rules

- Keep todos specific and actionable.
- Keep only one item `in_progress` at a time.
- Mark an item completed immediately after finishing it.
- Add validation and memory-update todos when relevant.
- Cancel outdated todos instead of leaving them pending.

## Suggested Todo Shape

- Read context and architecture.
- Implement the smallest correct change.
- Validate with targeted commands.
- Update memory/docs if meaningful.
- Summarize outcome and risks.

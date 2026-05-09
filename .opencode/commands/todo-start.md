---
description: Create a practical todo list for a multi-step task before implementation.
agent: orchestrator
---

Create a todo list for this task: $ARGUMENTS

Rules:
- Use todos when the task has 3 or more meaningful steps, touches multiple files/layers, includes verification, or updates `docs/ai/`.
- Keep one item `in_progress` at a time.
- Mark items complete immediately after finishing them.
- Include validation and memory-update todos when they apply.
- Do not overuse todos for trivial one-step questions.

Deliver:
- A concise todo list with priorities.
- The first item to start.

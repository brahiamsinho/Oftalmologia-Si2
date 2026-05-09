---
description: Plan and run safe validation checks for backend, frontend, mobile, and Docker when available.
agent: qa-testing
subtask: true
---

Use a todo list because validation spans multiple layers.

Validate the project stack for: $ARGUMENTS

Preferred checks:
- Backend: Django/DRF tests or targeted pytest if dependencies are available.
- Frontend: lint/build/type checks if scripts exist.
- Mobile: `flutter analyze`, `dart format --set-exit-if-changed`, and targeted tests if Flutter is available.
- Docker: `docker compose ps`, service logs, and health-oriented checks when Docker is running.
- OpenCode: `opencode debug config` when configuration changed.

Rules:
- Inspect available scripts/config before choosing commands.
- Prefer Docker-based validation when host dependencies are incomplete.
- Do not claim a command passed unless it actually ran successfully.
- If a tool is unavailable, report the blocker and the exact command the user should run later.

Deliver:
- Commands executed.
- Pass/fail/blocker result.
- Regression risks not covered.
- Recommended next validation step.

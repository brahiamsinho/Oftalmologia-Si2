---
name: project-memory
description: Maintain the docs/ai live memory after meaningful changes, including current state, handoff, next steps, decisions, and session logs.
license: MIT
compatibility: opencode
metadata:
  project: oftalmologia-si2
  workflow: memory
---

# Project Memory Skill

Use this skill when a task changes project behavior, architecture, agents, commands, skills, deployment assumptions, PUDS artifacts, or important documentation.

## Required Context

Read first:
- `AGENTS.md`
- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/DECISIONS_LOG.md`

Read if relevant:
- `docs/ai/PROJECT_VISION.md`
- `docs/ai/ARCHITECTURE.md`
- `docs/ai/TECH_STACK.md`
- `docs/ai/SKILLS_REGISTRY.md`
- `docs/ai/PROMPTS_LIBRARY.md`
- `docs/ai/PUDS_GUIDE.md`
- `docs/ai/TRACEABILITY_MATRIX.md`

## Workflow

1. Use a todo list for memory updates because at least three files are usually affected.
2. Identify what actually changed. Do not invent completed work.
3. Update `CURRENT_STATE.md` with a dated concise summary.
4. Update `HANDOFF_LATEST.md` with continuation context.
5. Update `NEXT_STEPS.md` by marking completed items and adding useful pending items.
6. Update `DECISIONS_LOG.md` only for durable technical decisions.
7. Create a session file under `docs/ai/sessions/YYYY-MM-DD-agent-resumen-corto.md`.
8. If commands, skills, prompts, or agent workflows changed, update `SKILLS_REGISTRY.md` or `PROMPTS_LIBRARY.md`.

## Safety Rules

- Never include real secrets, tokens, private keys, production credentials, or private `.env` values.
- Prefer short operational memory over long narrative documentation.
- Preserve evidence: mention files and commands actually changed or run.
- Keep PUDS traceability when the change affects requirements, modules, tests, or deployment.

## Deliverable

Return:
- Files updated.
- Summary of memory changes.
- Remaining follow-up tasks.

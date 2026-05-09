---
name: puds-traceability
description: Analyze and improve traceability between requirements, use cases, modules, implementation, tests, deployment, and academic defense artifacts.
license: MIT
compatibility: opencode
metadata:
  project: oftalmologia-si2
  workflow: puds
---

# PUDS Traceability Skill

Use this skill for academic defense, architecture review, software engineering artifacts, or when connecting implementation work to PUDS.

## What To Check

- Vision and scope.
- Functional and non-functional requirements.
- Actors and use cases.
- Logical packages and module boundaries.
- Components and deployment units.
- Sequence flows for important interactions.
- Data model and migrations.
- Tests and validation evidence.
- Traceability from requirement to code and tests.

## Workflow

1. Use a todo list because PUDS review spans analysis, design, implementation, testing, and deployment.
2. Read existing artifacts in `docs/ai/` and `docs/` before recommending new files.
3. Separate evidence from assumptions.
4. Map implementation modules to PUDS artifacts:
   - Backend apps map to logical/domain packages.
   - Next.js pages/components map to presentation components.
   - Flutter screens/repositories map to mobile presentation/integration components.
   - Docker Compose maps to deployment design.
5. Identify missing artifacts only when they add real defense or maintenance value.

## Recommended Output

- Existing artifacts.
- Missing artifacts.
- Traceability matrix notes.
- Defense-ready explanation.
- Highest-value next artifacts.

## Safety Rules

- Do not invent diagrams or requirements that are not supported by code/docs.
- If uncertain, label the conclusion as uncertain.

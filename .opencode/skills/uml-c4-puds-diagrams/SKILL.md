---
name: uml-c4-puds-diagrams
description: Workflow for UML 2.5+, C4, PlantUML versioning, draw.io synchronization, and PUDS traceability-aware diagram maintenance.
---

# Purpose

Provide a repeatable workflow for creating and maintaining architecture/analysis diagrams with evidence from the real codebase.

# Use when

- User asks for UML/C4/PlantUML/draw.io diagrams.
- PUDS artifacts require package, sequence, class, or deployment modeling.
- Architecture changes require diagram synchronization.

# Rules

1. Validate module names and boundaries from code before diagramming.
2. Prefer PlantUML as version-controlled source.
3. Keep draw.io editable diagrams synchronized with PlantUML updates.
4. If EA is available in environment, sync optionally after source updates.
5. Update `docs/diagrams/agent-memory/` and `docs/ai/` memory when changes are meaningful.

# Suggested structure

- `docs/diagrams/uml/`
- `docs/diagrams/c4/`
- `docs/diagrams/drawio/`
- `docs/diagrams/agent-memory/`

# Minimum deliverables

- Diagram source files changed.
- What was modeled and from which code evidence.
- Pending unknowns and assumptions.
- Recommended next modeling steps.

# OpenCode Skills

Project-local OpenCode skills should live in `.opencode/skills/`.

Current project-local skills:

- `project-memory`
- `puds-traceability`
- `security-review`
- `docker-debug`
- `clinical-ux-review`
- `todo-workflow`

Additional workspace skills detected under `.agents/skills/`:

- `caveman`
- `find-skills`

The skill `find-skills` is installed and available in this environment. Use it to discover or install reusable workflows when needed.

Each skill must live in `.opencode/skills/<name>/SKILL.md`, and the frontmatter `name` must match the folder name.

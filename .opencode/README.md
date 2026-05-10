# OpenCode Project Configuration

This directory is the project-local OpenCode configuration directory.

OpenCode loads markdown agents from `.opencode/agents/`. The file name is the agent name, so `backend.md` creates the `backend` agent.

Important: do not place documentation-only markdown files inside `.opencode/agents/`, because OpenCode treats every markdown file there as an agent.

## Agents

_Definiciones equivalentes para **Cursor** (Project Rules, `@agent-*`): `.cursor/rules/*.mdc` — ver `.cursor/rules/README.md`. OpenCode sigue usando solo `.opencode/agents/`._

- `orchestrator`: primary coordinator and router.
- `backend`: Django, DRF, PostgreSQL, JWT, tenant, permissions, migrations, backend tests.
- `frontend`: Next.js, React, dashboard UI, services, forms, responsive UX, accessibility.
- `mobile`: Flutter, Dart, Dio, secure storage, mobile screens, navigation, state, and API integration.
- `ui-ux`: web/mobile UX, accessibility, responsive design, forms, feedback states, and reusable UI patterns.
- `architecture`: modular design, API contracts, multi-tenant strategy, PUDS traceability.
- `architect-planner`: phased planning for large or ambiguous work.
- `code-review`: bug, security, regression, validation, and maintainability review.
- `qa-testing`: test planning, execution, validation, and regression checks.
- `devops`: Docker, Docker Compose, CI/CD, env config, VM/cloud deployment, networking, Nginx, HTTPS, logs, cron, and backups.
- `infra`: Docker Compose, env config, deployment, networking, CORS, hosts, cron, and secrets hygiene.

## Orchestration Flow

1. `orchestrator` reads project memory first: `AGENTS.md`, `docs/ai/PROJECT_VISION.md`, `docs/ai/ARCHITECTURE.md`, `docs/ai/TECH_STACK.md`, `docs/ai/CURRENT_STATE.md`, `docs/ai/HANDOFF_LATEST.md`, and `docs/ai/NEXT_STEPS.md`.
2. It classifies intent by domain.
3. Single-domain tasks are routed to one specialist subagent.
4. Mixed tasks are split by domain and assigned to multiple specialists.
5. Specialist outputs are consolidated by `orchestrator`.
6. `code-review` and `qa-testing` are used when the task changes code or carries regression risk.
7. If a durable decision or meaningful project change occurs, `docs/ai/` memory is updated.
8. Agents should use todo lists for multi-step tasks, cross-layer changes, validation, and memory updates.

## Commands

OpenCode loads project commands from `.opencode/commands/`.

Current project commands:

- `/check-project`: review git state, OpenCode setup, skills/plugins, and AI memory without changing code.
- `/commit`: safely create a git commit after checking secrets, `.gitignore`, staged/unstaged changes, and message intent.
- `/update-memory`: update `docs/ai/` after meaningful project changes.
- `/review-security`: security-focused review for secrets, hardcoding, auth, permissions, CORS, tenant isolation, and clinical data exposure.
- `/validate-stack`: plan and run safe validation checks for backend, frontend, mobile, Docker, and OpenCode config.
- `/puds-status`: review PUDS artifacts, traceability, and academic defense readiness.
- `/handoff`: produce a continuation handoff for the next agent/session.
- `/todo-start`: create a structured todo list before multi-step implementation.

## Format Note

The format is hybrid but OpenCode-compatible:

- Frontmatter contains only OpenCode-supported operational fields such as `description`, `mode`, and `permission`.
- The body contains the detailed technical role, scope, working rules, and deliverables.

Model inheritance is achieved by omitting `model`. OpenCode documentation says subagents inherit the invoking primary agent model when no model is specified.

## Skills

OpenCode loads project skills from `.opencode/skills/`.

Current project-local skills:

- `project-memory`: maintain `docs/ai/` current state, handoff, next steps, decisions, and session logs.
- `puds-traceability`: connect requirements, use cases, modules, code, tests, deployment, and defense artifacts.
- `security-review`: review secrets, environment handling, auth, permissions, tenant isolation, JWT, CORS, and clinical data exposure.
- `docker-debug`: diagnose Docker Compose, containers, environment variables, logs, ports, cron, and deployment issues.
- `clinical-ux-review`: review ophthalmology web/mobile UX, accessibility, responsive behavior, forms, feedback states, and reusable UI patterns.
- `todo-workflow`: standardize todo-list usage for multi-step work.

Additional workspace skills detected under `.agents/skills/`: `caveman` and `find-skills`.

`find-skills` is installed and available in this environment. Use it when a reusable workflow is needed and no local OpenCode skill exists yet.

## Plugins

OpenCode loads project plugins from `.opencode/plugins/`.

Current project plugins:

- `env-protection.js`: blocks tool access to real `.env` files while allowing `.env.example`, `.env.sample`, and `.env.template` documentation files.

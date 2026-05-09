---
name: docker-debug
description: Diagnose Docker Compose, container networking, environment variables, logs, ports, migrations, cron jobs, and deployment issues.
license: MIT
compatibility: opencode
metadata:
  project: oftalmologia-si2
  workflow: devops
---

# Docker Debug Skill

Use this skill for Docker, Docker Compose, VM/cloud, deployment, networking, environment variable, logs, and scheduled job problems.

## Mental Model

- Host commands run on the developer machine or VM.
- Container commands run inside a service with `docker compose exec`.
- Containers talk to each other by Compose service name, not `localhost`.
- Real secrets live in `.env` files and must not be printed.

## Workflow

1. Use a todo list because Docker debugging usually requires several checks.
2. Inspect `docker-compose.yml`, Dockerfiles, entrypoints, and `.env.example`, not real `.env` files.
3. Check service state with `docker compose ps` when Docker is available.
4. Check targeted logs with `docker compose logs <service>` when needed.
5. Verify migrations, static files, frontend env, backend env, CORS/hosts, and network names.
6. For cron/recordatorios, check command, logs, idempotency, and batch limits.

## Useful Commands

- `docker compose ps`
- `docker compose logs backend`
- `docker compose logs frontend`
- `docker compose exec backend python manage.py migrate --check`
- `docker compose exec backend python manage.py test`
- `docker compose exec backend python manage.py procesar_recordatorios --limit 10`

## Safety Rules

- Do not print `.env` contents.
- Do not run destructive commands like volume deletion unless explicitly requested.
- Do not expose PostgreSQL publicly unless explicitly required and secured.

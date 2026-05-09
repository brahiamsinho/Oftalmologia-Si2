# Session: sistema multi-agente OpenCode local

## Goal

Configurar un sistema multi-agente OpenCode del proyecto con formato hibrido: frontmatter machine-readable compatible y cuerpo tecnico detallado.

## Context Read

- `AGENTS.md`
- `docs/ai/PROJECT_VISION.md`
- `docs/ai/ARCHITECTURE.md`
- `docs/ai/TECH_STACK.md`
- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- estructura `.opencode/` existente

## Discoveries

- No existia `.opencode/agents/`.
- No existia `.opencode/skills/` dentro del repo.
- La arquitectura real es monorepo modular: Django/DRF backend, Next.js frontend, Flutter mobile, PostgreSQL y Docker Compose.
- El proyecto usa memoria viva en `docs/ai/`, por lo que el cambio debia quedar registrado.
- La documentacion oficial de OpenCode indica que los agentes markdown de proyecto viven en `.opencode/agents/`, que el nombre sale del nombre de archivo y que el campo `tools` esta deprecado a favor de `permission`.

## Accomplished

- Se creo `.opencode/agents/`.
- Se creo `.opencode/skills/` como punto local para skills futuras.
- Se creo `.opencode/skills/README.md` para documentar que aun no hay skills locales instaladas.
- Se crearon ocho agentes en formato hibrido:
  - `orchestrator`
  - `backend`
  - `frontend`
  - `architecture`
  - `architect-planner`
  - `code-review`
  - `qa-testing`
  - `infra`
- Se creo `.opencode/README.md` con lista de agentes, flujo de orquestacion, routing rules e integracion de skills.
- Se evito dejar README dentro de `.opencode/agents/` porque `opencode debug config` lo cargaba como un agente accidental llamado `README`.
- Se normalizo el frontmatter a campos compatibles: `description`, `mode` y `permission`.
- Se omitio `model` para heredar el modelo del agente invocador segun OpenCode.
- Se actualizo memoria viva: `CURRENT_STATE.md`, `HANDOFF_LATEST.md`, `NEXT_STEPS.md` y `DECISIONS_LOG.md`.

## Routing Summary

- `orchestrator`: clasifica intencion, delega por dominio, divide tareas mixtas y consolida respuesta.
- `backend`: Django, DRF, API, tenant, auth, permisos, modelos, migraciones y tests backend.
- `frontend`: Next.js, React, servicios, formularios, UX, responsive y accesibilidad.
- `architecture`: limites modulares, contratos API, multi-tenant, PUDS y decisiones durables.
- `architect-planner`: fases, roadmap, dependencias y riesgos.
- `code-review`: bugs, seguridad, regresiones, validaciones faltantes y riesgos.
- `qa-testing`: comandos, escenarios, regresion y gaps de cobertura.
- `infra`: Docker Compose, `.env`, despliegue, VM, CORS, hosts, cron y secretos.

## Skills

- Skills locales detectadas: ninguna.
- Skill global disponible: `find-skills`.
- Regla operativa: si se necesita una skill de deploy, brevity mode u otro workflow repetible y no existe localmente, el `orchestrator` debe usar `find-skills` antes de inventar una solucion.

## Next Steps

- Definir si conviene instalar skills locales para despliegue, revision academica/PUDS o modo breve.
- Mantener los agentes sincronizados si cambian arquitectura, stack o reglas de memoria.

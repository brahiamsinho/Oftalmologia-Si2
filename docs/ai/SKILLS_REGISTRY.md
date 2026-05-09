# SKILLS REGISTRY

Registro de skills reutilizables disponibles para OpenCode en este proyecto.

## Skills Locales OpenCode

Estas skills viven en `.opencode/skills/<name>/SKILL.md`.

| Skill | Proposito | Cuándo usarla |
|---|---|---|
| `project-memory` | Mantener memoria viva en `docs/ai/`. | Despues de cambios significativos, decisiones, workflows, agentes, despliegue o arquitectura. |
| `puds-traceability` | Conectar requisitos, casos de uso, modulos, codigo, pruebas y despliegue. | Revision academica, defensa, arquitectura o trazabilidad PUDS. |
| `security-review` | Revisar secretos, auth, permisos, tenant isolation, CORS, JWT y datos clinicos. | Cambios de backend, auth, despliegue, roles, serializers, viewsets o configuracion. |
| `docker-debug` | Diagnosticar Docker Compose, contenedores, env vars, logs, puertos, cron y despliegue. | Problemas de contenedores, VM, red, migraciones, logs o recordatorios programados. |
| `clinical-ux-review` | Revisar UX clinica web/mobile, accesibilidad, responsive, formularios y estados. | Cambios en Next.js, Flutter, formularios, pantallas, modales o flujos de usuario. |
| `todo-workflow` | Estandarizar uso de todo-list para tareas multi-paso. | Trabajos con 3+ pasos, varias capas, validacion o actualizacion de memoria. |

## Skills De Workspace

Estas skills viven en `.agents/skills/` y fueron instaladas por el sistema de skills compatible.

| Skill | Proposito |
|---|---|
| `caveman` | Modo de comunicacion ultra breve. |
| `find-skills` | Buscar o instalar skills cuando haga falta una capacidad reutilizable nueva. |

## Regla Operativa

- El `orchestrator` debe preferir skills locales antes de pedir al usuario que repita instrucciones largas.
- Si una capacidad reusable no existe, usar `find-skills` antes de inventar un workflow grande.
- Las skills no deben leer secretos ni reemplazar validaciones reales del sistema.

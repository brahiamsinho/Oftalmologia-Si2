# PROMPTS LIBRARY

Prompts y comandos reutilizables configurados para OpenCode en este proyecto.

## Comandos OpenCode

Estos comandos viven en `.opencode/commands/*.md`.

| Comando | Proposito | Agente sugerido |
|---|---|---|
| `/check-project` | Revisar salud del proyecto, configuracion OpenCode, git y memoria sin editar. | `orchestrator` |
| `/commit` | Crear commit seguro revisando secretos, `.gitignore`, cambios staged/unstaged y mensaje. | `orchestrator` |
| `/update-memory` | Actualizar `docs/ai/` despues de cambios significativos. | `orchestrator` |
| `/review-security` | Revisar secretos, hardcoding, auth, permisos, CORS, tenant isolation y exposicion de datos clinicos. | `code-review` |
| `/validate-stack` | Validar backend, frontend, mobile, Docker y configuracion cuando aplique. | `qa-testing` |
| `/puds-status` | Revisar artefactos PUDS, trazabilidad y defensa academica. | `architecture` |
| `/handoff` | Generar resumen de continuidad para otro agente o sesion. | `orchestrator` |
| `/todo-start` | Crear una lista de tareas ordenada antes de un trabajo multi-paso. | `orchestrator` |

## Convencion De Uso

- Usar `/todo-start` o todo-list nativo cuando la tarea tenga varias etapas.
- Usar `/commit "mensaje"` para commits seguros con revision previa de secretos, `.gitignore`, diff y staged files.
- Usar `/update-memory` al terminar cambios importantes.
- Usar `/review-security` antes de cerrar cambios sensibles de backend, auth, permisos, tenant o despliegue.
- Usar `/validate-stack` antes de commits o handoffs importantes.
- Usar `/puds-status` para preparacion academica, defensa o revision de trazabilidad.

## Relacion Con PUDS

- `/puds-status` y `puds-traceability` cubren analisis, diseno, implementacion, pruebas y despliegue.
- `/update-memory` preserva continuidad y trazabilidad del proceso.
- `/validate-stack` aporta evidencia para la fase de pruebas.
- `/handoff` aporta mantenimiento y continuidad entre sesiones/agentes.

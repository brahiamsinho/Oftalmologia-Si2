# Sesion 2026-05-08 - OpenCode workflows: comandos, skills, plugin y todo-list

## Objetivo

Agregar workflows reutilizables a OpenCode para mejorar productividad, seguridad, continuidad entre agentes y trazabilidad PUDS.

## Cambios Realizados

- Se creo `.opencode/commands/` con comandos:
  - `/check-project`
  - `/commit`
  - `/update-memory`
  - `/review-security`
  - `/validate-stack`
  - `/puds-status`
  - `/handoff`
  - `/todo-start`
- Se creo `.opencode/skills/` con skills:
  - `project-memory`
  - `puds-traceability`
  - `security-review`
  - `docker-debug`
  - `clinical-ux-review`
  - `todo-workflow`
- Se creo `.opencode/plugins/env-protection.js` para bloquear acceso a `.env` reales y permitir plantillas.
- Se actualizaron todos los agentes de `.opencode/agents/` para recomendar todo-list en trabajos multi-paso.
- Se agrego `skill: allow` a los agentes especialistas para permitir carga de skills.
- Se actualizo el `orchestrator` con routing recomendado de skills.
- Se actualizaron `.opencode/README.md` y `.opencode/skills/README.md`.
- Se crearon `docs/ai/SKILLS_REGISTRY.md` y `docs/ai/PROMPTS_LIBRARY.md`.

## Decision Tecnica

Se priorizan comandos y skills sobre plugins complejos porque son mas simples, auditables y seguros. El unico plugin agregado por ahora es `env-protection`, debido a que protege secretos y tiene bajo riesgo operativo.

Se agrego `/commit` como workflow seguro, no como alias directo de `git commit`, para forzar revision de secretos, `.gitignore`, staged/unstaged changes y coherencia del mensaje antes de commitear.

## Validacion

- `opencode debug config` ejecutado correctamente.
- La configuracion resuelta muestra agentes actualizados con `skill: allow`.
- La configuracion resuelta muestra comandos cargados: `check-project`, `update-memory`, `review-security`, `validate-stack`, `puds-status`, `handoff` y `todo-start`.
- La configuracion resuelta muestra el plugin local `file:///D:/Oftalmologia-SI2/.opencode/plugins/env-protection.js` cargado.
- Revisar en la TUI de OpenCode que los comandos aparezcan con `/`.

## Siguiente Paso Recomendado

Usar `/check-project` al iniciar una sesion larga y `/update-memory` al cerrar cambios significativos.

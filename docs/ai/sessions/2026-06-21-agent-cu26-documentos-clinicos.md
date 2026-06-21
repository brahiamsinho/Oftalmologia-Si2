# CU26 documentos clínicos autorizados

## Goal
Implementar documentos clínicos descargables y autorizados para recetas e indicaciones en el backend.

## Instructions
- Mantener la solución dentro de `apps.pacientes.historial_clinico` por ser el punto natural de agregación.
- Priorizar el menor cambio posible y respetar la arquitectura multi-tenant por schema.

## Discoveries
- `historial_clinico.urls` necesitaba rutas manuales antes del include del router; de lo contrario los endpoints nuevos quedaban tapados.
- Para probar tenant-scoping en este repo fue más fiable usar `schema_context` + `APIRequestFactory` que `APIClient` con rutas tenant-prefixed.

## Accomplished
- ✅ Se agregó `DocumentoClinicoAutorizado` con estado, tipo, paciente, historia, autorizador, timestamps y filename.
- ✅ Se creó el servicio PDF con reportlab y descarga segura.
- ✅ `get_recetas()` ahora devuelve documentos reales autorizados.
- ✅ Se agregaron endpoints de staff/paciente y pruebas de autorización, descarga y aislamiento.

## Next Steps
- Exponer estos documentos en frontend web/mobile cuando el alcance lo pida.

## Relevant Files
- backend/apps/pacientes/historial_clinico/models.py — modelo persistente CU26.
- backend/apps/pacientes/historial_clinico/views.py — endpoints staff/paciente y descarga PDF.
- backend/apps/pacientes/historial_clinico/services.py — generador PDF.
- backend/apps/pacientes/historial_clinico/tests/test_documentos_clinicos.py — cobertura de CU26.

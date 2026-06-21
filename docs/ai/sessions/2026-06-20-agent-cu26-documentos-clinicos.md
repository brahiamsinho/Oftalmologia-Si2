# Session 2026-06-20 - CU26 documentos clínicos

## Goal
Implementar CU26 para recetas e indicaciones clínicas descargables de forma segura y anidada por historia clínica.

## Instructions
- Mantener CU26 en Atención clínica.
- No pedir IDs manuales al paciente si se puede resolver desde el contrato de auth.
- Respetar rutas anidadas y bitácora.
- Actualizar `docs/ai/` y la memoria persistente después del cambio.

## Discoveries
- `GET /api/auth/me/` no exponía la historia clínica del paciente, así que el frontend no podía resolver el nested path sin un contrato nuevo.
- Ya existía `reportlab` en `backend/requirements/base.txt`, así que se pudo reutilizar para generar PDFs cuando no hay archivo subido.
- La pantalla paciente principal ya era `/InteligenciaArtificial`, por lo que era mejor extenderla que crear una ruta nueva para el primer corte.

## Accomplished
- ✅ Se creó `backend/apps/atencionClinica/documentos_clinicos` con modelo, serializer, service PDF, viewset, URLs, admin y migración inicial.
- ✅ Se enriqueció `UsuarioSerializer` y `PerfilSerializer` para exponer `paciente.historia_clinica.id_historia_clinica` en `auth/me` y login.
- ✅ Se conectó `HistoriaClinicaDetalleSerializer.recetas` a documentos reales en vez de placeholder.
- ✅ Se agregó bitácora `DESCARGAR`.
- ✅ Se actualizó el frontend paciente para listar y descargar documentos autorizados.
- ✅ Se actualizó el modal de historial clínico para listar y descargar documentos.
- ✅ Se actualizó `docs/ai/CURRENT_STATE.md`, `HANDOFF_LATEST.md`, `NEXT_STEPS.md`, `DECISIONS_LOG.md` y `PACKAGE_CU_MAP.md`.

## Relevant Files
- backend/apps/atencionClinica/documentos_clinicos/* - app nueva de documentos clínicos.
- backend/apps/usuarios/users/serializers.py - `auth/me` y login con ficha del paciente.
- backend/apps/pacientes/historial_clinico/serializers.py - `recetas` ahora devuelve documentos reales.
- frontend/src/app/(dashboard)/InteligenciaArtificial/page.tsx - sección “Mis documentos”.
- frontend/src/app/(dashboard)/(gestion-pacientes)/historial/page.tsx - descarga desde historial staff.
- docs/ai/* - memoria viva del cambio.

## Next Steps
- Validar flujo en Docker cuando esté disponible.
- Revisar si conviene agregar tests automatizados para descarga y ownership.

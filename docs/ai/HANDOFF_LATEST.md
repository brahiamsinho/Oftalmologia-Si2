# HANDOFF LATEST

*Handoff actualizado post Sprint 1 Backend.*

## Resumen de la Última Sesión
**Fecha:** 2026-03-28
Se implementó el **backend completo del Sprint 1** cubriendo las 19 tablas del DBML.
Se crearon 6 apps Django modulares, incluyendo `apps.bitacora` como app separada.
Se configuró Mailhog en Docker para captura de emails de desarrollo.

## Objetivo Trabajado
Implementación completa del backend Django (modelos, serializers, views, URLs, admin) para todas las entidades del Sprint 1: usuarios, seguridad, bitácora, pacientes, especialistas, historias clínicas y citas.

## Cambios Realizados y Archivos Tocados
- `docker-compose.yml` — Mailhog agregado
- `.env` / `.env.example` — Variables de email
- `config/settings.py` — Configuración unificada (sin carpeta settings/)
- `config/urls.py` — Todas las apps modulares anidadas limpiamente
- `apps/core/` — utils, permissions, health-check
- `apps/users/` — CustomUser completo con auth endpoints + CRUD gestión
- `apps/bitacora/` — App separada con acceso solo lectura via API
- `apps/pacientes/` — Paciente con auto numero_historia
- `apps/especialistas/` — Especialista (médico) separado lógicamente
- `apps/historial_clinico/` — Historia Clínica base
- `apps/antecedentes/`, `apps/diagnosticos/`, `apps/tratamientos/`, `apps/evoluciones/`, `apps/recetas/` — 5 Submódulos clínicos 100% aislados.
- `apps/citas/` — Citas con confirmar/cancelar/reprogramar

## Decisiones Técnicas Relevantes
- `Bitacora` es una **app separada** (`apps.bitacora`), no parte de `apps.users`. Se la invoca con `registrar_bitacora()` que atrapa silenciosamente cualquier error y no rompe transacciones.
- FKs a `Usuario` usan `settings.AUTH_USER_MODEL` (string) para evitar imports circulares.
- PKs siguen el DBML: `BigAutoField` con nombre `id_xxx`.
- `Especialista` se movió a su propio módulo `apps.especialistas`.
- La arquitectura monolítica `medical_records` se destruyó y se fragmentó en 6 micro-apps (`historial_clinico`, `antecedentes`, etc.) siguiendo Arquitectura Modular extrema.
- **Rutas Anidadas Clínicas:** El enrutamiento se mantuvo **anidado** (`/api/historial-clinico/5/recetas/`) en `config/urls.py` por razones de seguridad crítica en producción (prevención de bugs de caché frontend y fugas de datos masivas). Leer `ARCHITECTURE.md` para más detalles. No aplanar estas rutas en el futuro.
- Configuraciones unificadas en `config/settings.py` manejado puramente con `.env`.

## Dependencias / Variables de Entorno
```
EMAIL_HOST=mailhog
EMAIL_PORT=1025
FRONTEND_URL=http://localhost:3000
AUTH_USER_MODEL=users.Usuario
```

## Qué Quedó Pendiente
- Ejecutar `docker-compose up --build` y verificar migraciones.
- Crear fixtures para TipoCita (CONSULTA, ESTUDIO, CIRUGIA, SEGUIMIENTO_POSTOPERATORIO) y Roles base.
- Implementar Frontend (Next.js) consumiendo la API.
- Implementar Mobile (Flutter) consumiendo la API.

## Qué Debe Hacer el Siguiente Agente
- Verificar que las migraciones corren sin errores.
- Si hay errores de migración, revisarlos y corregir.
- Implementar fixtures/datos iniciales.
- Proceder con Frontend o Mobile según prioridad del usuario.

# Sesión 2026-04-12 — Frontend API, bitácora, permisos, layout móvil

## Objetivo
Corregir llamadas duplicadas `/api/api/`, registrar consulta/medición contra rutas reales de Django, mejorar bitácora (métricas, IP, hora Bolivia), permisos como catálogo estático, dashboard con datos reales y sidebar responsive.

## Cambios principales
- **Frontend:** `registrar-consulta` y `registrar-medicion` usan rutas relativas al `baseURL` (`/pacientes/`, `/citas/`, `POST /consultas/lista/`, `POST /consultas/estudios/`) y payload alineado al modelo (`motivo`, `notas_clinicas`, etc.).
- **Layout:** drawer móvil + backdrop; `useMediaQuery`; padding responsive en `main`.
- **Permisos (UI):** página solo lectura con nota de seed.
- **Roles:** carga de roles y permisos en dos bloques try/catch para no vaciar roles si falla permisos.
- **Bitácora (UI):** contadores vía `count` de la API; fecha/hora con `America/La_Paz`; columna usuario con nombre/email; módulos alineados al backend.
- **Dashboard:** métricas desde API; tarjeta “Consultas atendidas” = citas `ATENDIDA`; sin valor hardcodeado 24.
- **Backend:** `TIME_ZONE = America/La_Paz`; `PermisoViewSet` read-only + `IsAdministrativoOrAdmin`; bitácora en consultas, estudios, citas update/delete, roles, paciente delete; serializer bitácora + `usuario_email`; logout con `user_agent`.
- **Favicon:** `public/favicon.svg` + metadata.

## Archivos tocados (referencia)
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/registrar-consulta/page.tsx`
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/registrar-medicion/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`, `Sidebar.tsx`, `SidebarContext.tsx`
- `frontend/src/app/(dashboard)/(gestion-bitacora)/bitacora/page.tsx`
- `frontend/src/app/(dashboard)/(gestion-usuarios)/permisos/page.tsx`, `roles/page.tsx`
- `backend/config/settings.py`, `apps/usuarios/permisos/views.py`, `apps/bitacora/serializers.py`
- `backend/apps/atencionClinica/consultas/views.py`, `citas/views.py`, `pacientes/pacientes/views.py`, `usuarios/roles/views.py`, `usuarios/users/views.py`

## Verificación sugerida
1. `NEXT_PUBLIC_API_URL` termina en `/api` (sin doble prefijo en código cliente).
2. Crear paciente, consulta y medición; revisar bitácora (módulos `patients`, `consultas`, `estudios`, `appointments`, `roles`).
3. Roles → nuevo rol → checklist permisos (GET `/permisos/` como ADMIN o ADMINISTRATIVO).

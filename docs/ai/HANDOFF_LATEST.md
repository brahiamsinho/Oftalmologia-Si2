# HANDOFF LATEST

## Resumen
**Fecha:** 2026-05-09 (Multi-Tenant Frontend ? segunda parte, completo)

**Frontend Web (implementado hoy, segunda ronda):**

### E. `pacientes/page.tsx` ? Restriccion `max_pacientes`
Mismo patron que Usuarios. Consulta `organization/me/`, compara `total` con `plan.max_pacientes`.
Boton "Nuevo Paciente" deshabilitado si se alcanza el limite. Banners rojo/amarillo + badge `X/Y`.

### F. Backend `CitaViewSet` ? Filtro por fecha
Se agrego soporte para `?fecha_desde=YYYY-MM-DD` y `?fecha_hasta=YYYY-MM-DD` en `get_queryset()`.
Permite calcular el conteo mensual real de citas desde el frontend.

### G. `citas-agenda/page.tsx` ? Restriccion `max_citas_mes` mensual
Hace 2 llamadas al montar: `organization/me/` (plan) y citas del mes actual (usando `fecha_desde`/`fecha_hasta`).
Si `citasMesCount >= max_citas_mes`: boton "Agendar Cita" deshabilitado, banners, tarjeta "Este Mes" con badge `X/Y`.
El conteo se recalcula al crear o eliminar citas.

### H. `lib/api.ts` ? Interceptor 403 tenant inactivo
403 en ruta no-login ? limpia `TenantStorage` + `TokenStorage` ? redirige a `/login?motivo=tenant_inactivo`.
El login detecta ese parametro y muestra un aviso naranja.

### I. `planes/page.tsx` ? Conectada con backend real
- Carga planes desde `GET /api/plans/` (endpoint publico).
- Carga plan actual desde `GET organization/me/`.
- Boton "Mejorar Plan" / "Bajar a este plan" abre modal de confirmacion.
- Maneja downgrade (checkbox de confirmacion, validacion de uso vs limites del plan nuevo).
- Llama a `POST organization/change-plan/` y muestra feedback de exito/error.

### J. `TenantContext` + refactor de llamadas duplicadas

Se creo `context/TenantContext.tsx`:
- Hace `GET organization/me/` UNA sola vez al montar el dashboard layout.
- Expone `orgData`, `planInfo`, `flags` y `refresh` a todo el arbol de componentes.
- Las paginas `usuarios`, `pacientes` y `citas-agenda` ahora consumen `useTenant()`
  en vez de hacer su propia llamada a `organization/me/` ? 0 requests duplicados.

### K. Sidebar con branding real + modulos condicionales

`Sidebar.tsx` ahora:
- Muestra nombre y logo real de la clinica usando `TenantStorage` + `orgData.branding`.
- Si `branding.logo_url` existe, renderiza `<Image>` del logo real; si no, usa el icono
  con `color_primario` del plan.
- Badge "Trial" en el header y en el item "Planes" si `subscription.estado === 'TRIAL'`.
- Modulo **CRM** aparece solo si `planInfo.permite_crm && flags.mostrar_modulo_crm`.
- Modulo **Notificaciones** aparece solo si `planInfo.permite_notificaciones && flags.mostrar_notificaciones`.
- Modulo **Reportes** aparece solo si `planInfo.permite_reportes_avanzados`.
- Se agrego grupo "Cuenta" con "Mi Perfil" y "Planes".

### L. `authService.login()` guarda tenant del response

El login multi-tenant devuelve `{ usuario, tenant, access, refresh }`.
`authService.login()` ahora llama `TenantStorage.setTenantData()` y `TenantStorage.setSlug()`
con los datos frescos del response, sincrorizando el storage sin necesidad de paso adicional.

### M. Nuevos tipos: `TenantOrgData`, `TenantOrgSettings`, `TenantFlags`

`lib/api.ts` ahora exporta:
- `TenantOrgData` ? shape de `GET organization/me/` (branding, config, settings, subscription, usage).
- `TenantOrgSettings` ? shape del endpoint `GET/PATCH organization/settings/`.
- `TenantFlags` ? flags de modulos (`mostrar_modulo_crm`, `mostrar_notificaciones`, etc.).
- `TenantSubscriptionEstado` ? union type del estado de suscripcion.

### N. `TenantContext` ampliado ? `usage` + `trial`
- Expone `usage` (contadores reales del backend) y `trial` (`isTrial`, `diasRestantes`).
- Pages `usuarios`, `pacientes`, `citas` usan `usage.xxx_actuales` para l?mites reales.
- `citas-agenda` elimina el fetch mensual extra cuando el backend expone `usage`.

### O. Banner TRIAL en el dashboard layout
`TrialBanner` se muestra entre el Header y `<main>` si `trial.isTrial === true`.
Colores rojo/naranja/amarillo seg?n d?as restantes. Bot?n "Ver Planes" + dismiss.

### P. P?gina `/configuracion-org`
Conectada a `GET/PATCH organization/settings/`. Permite cambiar: nombre de la cl?nica,
logo (preview en tiempo real), colores (color picker + hex), timezone, idioma, y flags
de m?dulos (`permit_reserva_online`, `mostrar_modulo_crm`, `mostrar_notificaciones`).
Al guardar llama `refresh()` del TenantContext ? Sidebar actualiza inmediatamente.

### Q. CU12 - Evaluaciones Quirurgicas (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/evaluacion_quirurgica.ts` ? CRUD completo + tipos TypeScript.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/evaluaciones-quirurgicas/page.tsx` ? pagina completa.

La pagina incluye:
- Header con boton "Nueva evaluacion".
- 4 tarjetas de estadisticas: Total / Aptos / No aptos / Pendientes.
- Filtros: busqueda en texto + filtro por estado prequirurgico.
- Lista de tarjetas con: nombre de paciente, fecha, badge de estado, riesgo, preview de hallazgos.
- Modal crear/editar con 4 secciones: Paciente y HC / Datos de evaluacion / Hallazgos y plan / Estudios y observaciones.
- Toggle para `requiere_estudios_complementarios` que muestra campo `estudios_solicitados` de forma condicional.
- Modal de confirmacion de eliminacion.
- `Sidebar.tsx` actualizado: nuevo NavItem "Eval. Quirurgica" con icono `Scissors` bajo Atencion Clinica.
- `Header.tsx` actualizado: breadcrumb para `/evaluaciones-quirurgicas`.
- `lib/services/index.ts` actualizado: exporta `evaluacionQuirurgicaService`.

API backend: `GET/POST/PATCH/DELETE /evaluaciones-quirurgicas/`
Permisos backend: lectura para todos los autenticados; escritura solo `IsMedicoOrAdmin`.

### R. CU13 - Preoperatorio (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/preoperatorio.ts` ? CRUD completo + tipos TypeScript.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/preoperatorio/page.tsx` ? pagina completa.

La pagina incluye:
- 4 stat cards: Total / Aprobados / En proceso / Pendientes.
- Filtros: busqueda + filtro por estado.
- Lista de tarjetas con: nombre paciente, badge de estado, fecha creacion, fecha cirugia programada, chips checklist/anestesia.
- Modal 5 secciones: Paciente y referencias / Estado / Checklist / Examenes / Aptitud.
- Selector de evaluacion quirurgica vinculando CU12 con CU13.
- Toggle visual para `checklist_completado` y `apto_anestesia`.
- Aviso en tiempo real si el usuario intenta seleccionar estado APROBADO sin cumplir los requisitos.
- Validacion espejo de la regla backend: APROBADO requiere checklist_completado=true y apto_anestesia=true.
- `Sidebar.tsx` actualizado: NavItem "Preoperatorio" con icono `ClipboardList`.
- `Header.tsx` actualizado: breadcrumb `/preoperatorio`.
- `lib/services/index.ts` actualizado: exporta `preoperatorioService`.

API backend: `GET/POST/PATCH/DELETE /preoperatorios/`
Permisos backend: lectura para todos los autenticados; escritura solo `IsMedicoOrAdmin`.
Regla de negocio clave: `estado=APROBADO` solo cuando `checklist_completado && apto_anestesia`.

### S. CU14 - Cirugias (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/cirugias.ts` ? CRUD + accion especial `reprogramar()`.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/cirugias/page.tsx` ? pagina completa.

La pagina incluye:
- 4 stat cards: Total / Programadas / En curso / Finalizadas.
- Filtros: busqueda + filtro por estado (5 estados: PROGRAMADA, REPROGRAMADA, EN_CURSO, FINALIZADA, CANCELADA).
- Lista de tarjetas con: nombre paciente, badge de estado, fecha programada, procedimiento (preview), fechas reales + duracion calculada en minutos, chips de reprogramacion y complicaciones.
- Modal CRUD (5 secciones): Paciente y referencias / Programacion / Procedimiento / Resultado y complicaciones / Observaciones.
- Selector de preoperatorio vinculando CU13 con CU14.
- Validacion espejo de las reglas del backend (FINALIZADA requiere fechas reales; fecha_inicio <= fecha_fin).
- Aviso en tiempo real si estado = FINALIZADA sin fechas reales ingresadas.
- Mini-modal exclusivo "Reprogramar" ? llama a `POST /cirugias/{id}/reprogramar/` con nueva fecha + motivo.
- Boton "Reprogramar" visible solo en estados no terminales (no FINALIZADA ni CANCELADA).
- `Sidebar.tsx` actualizado: NavItem "Cirugias" con icono `Scalpel`.
- `Header.tsx` actualizado: breadcrumb `/cirugias`.
- `lib/services/index.ts` actualizado: exporta `cirugiasService`.

### T. CU15 - Postoperatorio (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/postoperatorio.ts` ? CRUD completo + tipos TypeScript.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/postoperatorio/page.tsx` ? pagina completa.

La pagina incluye:
- Banner de alertas: muestra controles con proximo_control vencido o en las proximas 48h.
- 4 stat cards: Total / Estables / En observacion / Complicados (el contador de Complicados se pone en rojo si > 0).
- 3 filtros: busqueda libre, estado, y filtro por fecha exacta (?fecha=YYYY-MM-DD ? feature nativa del backend).
- Tarjetas con borde de color lateral (verde=estable, azul=observacion, rojo=complicado, gris=cerrado).
- Indicador de urgencia del proximo control: "Vencido" / "Ma?ana" / "en Xd" con colores rojo/amber/teal.
- Zona visual especial para alertas clinicas (fondo ambar) en tarjeta y en formulario.
- Modal CRUD (4 secciones): Paciente y referencias / Fechas / Alertas / Evoluci?n y observaciones.
- Selector de cirug?a (vinculo CU14 ? CU15).
- Aviso contextual en el formulario si estado = COMPLICADO.
- Validacion: fecha_control obligatoria; proximo_control >= fecha_control.
- `Sidebar.tsx` actualizado: NavItem "Postoperatorio" con icono HeartPulse.
- `Header.tsx` actualizado: breadcrumb `/postoperatorio`.

API backend: `GET/POST/PATCH/DELETE /cirugias/` + `POST /cirugias/{id}/reprogramar/`
Permisos backend: lectura para todos los autenticados; escritura y reprogramar solo `IsMedicoOrAdmin`.
Reglas de negocio:
  1. `fecha_programada` y `procedimiento` obligatorios.
  2. `estado=FINALIZADA` ? `fecha_real_inicio` y `fecha_real_fin` obligatorias.
  3. `fecha_real_inicio` <= `fecha_real_fin` (validacion cronologica).
  4. `cirujano` se asigna automaticamente a `request.user` al crear (no es campo editable del formulario).

---

### U. CU16 - CRM para la comunicacion con pacientes (backend extendido)

**Fecha:** 2026-05-09

El modulo `backend/apps/crm` existia parcialmente. Se extendio el modelo `HistorialContacto`
con los campos requeridos por CU16.

**Archivos modificados:**
- `backend/apps/crm/models.py` - 2 nuevos `TextChoices` (TipoMensaje, EstadoComunicacion) + 5 nuevos campos.
- `backend/apps/crm/serializers.py` - Validacion: estado=RESPONDIDO requiere respuesta_paciente.
- `backend/apps/crm/views.py` - Filtros ampliados (tipo_mensaje, estado_comunicacion); search incluye asunto, mensaje, respuesta.
- `backend/apps/crm/admin.py` - fieldsets completos + list_display/list_filter con campos nuevos.
- `backend/apps/crm/migrations/0003_historialcontacto_cu16_fields.py` - Migracion para aplicar.

**Nuevos campos en `HistorialContacto`:**
```
tipo_mensaje        RECORDATORIO|NOTIFICACION|SEGUIMIENTO|RESULTADO|INFORMATIVO|OTRO  (default: SEGUIMIENTO)
asunto              CharField 200, opcional
mensaje             TextField, opcional  -- contenido del mensaje enviado
respuesta_paciente  TextField, opcional  -- respuesta o interaccion del paciente
estado_comunicacion PENDIENTE|ENVIADO|ENTREGADO|LEIDO|RESPONDIDO|FALLIDO  (default: PENDIENTE)
```

**Para aplicar la migracion:**
```bash
docker compose exec backend python manage.py migrate crm
```

---

### V. CU16 - CRM Comunicaciones (frontend completo)

**Fecha:** 2026-05-09

Nuevos archivos:
- `frontend/src/lib/services/crm.ts` - Interfaces + constantes + `historialContactoService` + `campanaCRMService`.
- `frontend/src/app/(dashboard)/(gestion-crm)/crm/contactos/page.tsx` - Pagina completa CU16.

La pagina `/crm/contactos` incluye:
- Header con boton "Nueva comunicacion".
- 4 stat cards: Total / Pendientes / Respondidas / Fallidas (Fallidas en rojo si > 0).
- 4 filtros: busqueda libre + tipo de mensaje + estado de comunicacion + canal.
- Lista de tarjetas con borde lateral de color segun estado (amarillo=pendiente, azul=enviado, indigo=entregado, morado=leido, verde=respondido, rojo=fallido).
- Cada tarjeta muestra: icono del canal, nombre paciente, badge tipo_mensaje, badge estado (con icono), asunto, preview del mensaje, y bloque verde si hay respuesta_paciente.
- Modal CRUD con 4 secciones:
  1. Paciente y campana (selectors)
  2. Canal, tipo y estado (con aviso si estado=RESPONDIDO sin respuesta)
  3. Contenido del mensaje enviado (asunto + mensaje)
  4. Respuesta e interaccion del paciente (respuesta_paciente con resaltado verde + observaciones)
- Validacion espejo del backend: estado=RESPONDIDO requiere respuesta_paciente (error si vacio).
- Modal de confirmacion de eliminacion.

Archivos modificados:
- `Sidebar.tsx` - Fix import duplicado `ClipboardList`; label "Comunicaciones" con icono `MessageSquare`; orden: Comunicaciones primero, Campanas segundo.
- `Header.tsx` - Breadcrumbs `/crm/contactos`, `/crm/campanas`, `/crm`.
- `lib/services/index.ts` - Exporta `historialContactoService`, `campanaCRMService`, constantes y tipos.

API backend: `GET/POST/PATCH/DELETE /crm-contactos/`
Modulo visible solo si `planInfo.permite_crm && flags.mostrar_modulo_crm`.

---

### W. CU17 - Reportes y exportaciones (backend completo)

**Fecha:** 2026-05-09

Sub-modulo creado dentro del paquete CRM: `backend/apps/crm/reportes/`.
Patron: mismo que los sub-modulos de `atencionClinica` (cirugias, preoperatorio, etc.).

**Archivos creados:**
- `apps.py` ? `ReportesConfig` con `name='apps.crm.reportes'`
- `models.py` ? modelo `ReporteGenerado` (tabla: `crm_reportes_generados`)
- `serializers.py` ? `ReporteGeneradoSerializer` + `GenerarReporteRequestSerializer`
- `views.py` ? `ReportesViewSet` con 7 generadores + exportacion CSV
- `admin.py` ? admin readonly (sin add/change, solo auditoria)
- `urls.py` ? router con `reportes`
- `migrations/0001_initial.py`

**Archivos modificados:**
- `config/settings.py` ? `'apps.crm.reportes'` en `TENANT_APPS`
- `config/urls.py` ? `path('', include('apps.crm.reportes.urls'))`

**Endpoints:**
```
GET  /reportes/tipos/        ? catalogo de 7 tipos disponibles
GET  /reportes/              ? historial de reportes generados (paginado)
POST /reportes/generar/      ? generar reporte (JSON o CSV)
GET  /reportes/{id}/         ? metadatos de un reporte especifico
POST /reportes/{id}/regenerar/ ? re-ejecutar con mismos parametros
```

**Tipos de reporte:**
| Tipo | Modelos consultados |
|------|---------------------|
| RESUMEN_PACIENTES | Paciente |
| CITAS | Cita |
| CONSULTAS | Consulta |
| MEDICIONES_VISUALES | MedicionVisual |
| CIRUGIAS | Cirugia |
| POSTOPERATORIO | Postoperatorio |
| CRM_COMUNICACIONES | HistorialContacto |

**Request de ejemplo:**
```json
POST /reportes/generar/
{
  "tipo_reporte": "CIRUGIAS",
  "formato": "CSV",
  "fecha_desde": "2026-01-01",
  "fecha_hasta": "2026-05-09"
}
```

**Para aplicar la migracion:**
```bash
docker compose exec backend python manage.py migrate crm_reportes
```

**Proximos pasos:**
1. Frontend CU17: pagina `/reportes` con selector de tipo, rango de fechas, preview de datos y boton "Exportar CSV".
2. Mobile (Flutter): implementar `WorkspaceScreen` + `TenantInterceptor` de Dio.
   Guia completa en `docs/ai/sessions/2026-05-09-agent-multi-tenant-frontend.md` Seccion 5.
3. Validar limite `max_almacenamiento_mb` en subida de archivos (mediciones).
4. Flujo de recuperacion de contrasena adaptado al tenant.
5. Agregar campos anidados (nombre_completo paciente) en serializers de evaluacion_quirurgica,
   preoperatorio, cirugia y postoperatorio.

Detalle: `docs/ai/sessions/2026-05-09-agent-multi-tenant-frontend.md`

---

## Resumen
**Fecha:** 2026-05-09 (Multi-Tenant Frontend ? primera parte)

**Frontend Web:**
- `lib/api.ts`: `TenantStorage` + interceptor que reescribe `baseURL` a `/t/<slug>/api` automaticamente.
- `login/page.tsx`: flujo 2 pasos estilo Slack (slug ? credenciales + branding dinamico del tenant).
- `lib/services/auth.ts`: logout limpia `TenantStorage`.
- `usuarios/page.tsx`: restriccion por `max_usuarios` del plan. Boton deshabilitado + banners + badge `X/Y`.

Detalle: `docs/ai/sessions/2026-05-09-agent-multi-tenant-frontend.md`

---

## Resumen
**Fecha:** 2026-05-05 (Fase 1b multi-tenant segunda ola, parcial)

**Backend:** se reforz? el tenant-aware scoping en citas, consultas, CRM y automatizaciones con FK a `Tenant`, backfill `legacy` y serializers que bloquean tenant/relaciones cruzadas desde el cliente.

Detalle: `docs/ai/sessions/2026-05-05-agent-multi-tenant-fase1b-oleada2.md`

---

## Resumen
**Fecha:** 2026-05-04 (Fase 1b multi-tenant primera ola)

**Backend:** se agregaron FK nullable a `Tenant` en ra?ces cr?ticas (`Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora`, `Notificacion`, `DispositivoFcm`, `Especialista`) con backfill a `legacy`.

Detalle: `docs/ai/sessions/2026-05-04-agent-multi-tenant-fase1b-oleada1.md`

## Resumen
**Fecha:** 2026-05-04 (Fase 1a multi-tenant base)

**Backend:** se agrego la base multi-tenant con `apps.tenant`, middleware `X-Tenant-Slug` y contexto utilitario en `apps.core`.

Detalle: `docs/ai/sessions/2026-05-04-agent-multi-tenant-fase1a.md`

---

## Que debe hacer el siguiente agente
1. Leer `docs/ai/CURRENT_STATE.md` y la sesion de hoy.
2. Verificar `.env`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.
3. El desarrollador Mobile debe leer la Seccion 5 del archivo de sesion de hoy para implementar el interceptor en Flutter/Dio.
4. Si hay tiempo, aplicar restricciones de plan en CRM y Notificaciones con el mismo patron de `organization/me/`.

## Variables (recordatorio)
```
NEXT_PUBLIC_API_URL=.../api     # sin segunda barra /api en paths del cliente
tenant_slug=...                 # guardado en localStorage por TenantStorage al hacer login
```

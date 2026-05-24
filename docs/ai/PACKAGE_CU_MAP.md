# PACKAGE_CU_MAP — Paquetes PUDS ↔ código

**Fuente de verdad** para numeración de casos de uso (diagramas §3.10 Paquetes y casos de uso).  
Actualizado: 2026-05-23.

## Regla de tenant

Todo módulo de clínica vive en **`TENANT_APPS`**. Los clientes llaman:

```text
/t/<slug-clinica>/api/<recurso>/
```

No confundir con rutas en `public` (`/api/public/...`) ni con suscripción SaaS de plataforma.

---

## Paquete: Usuarios

| CU | Nombre | App Django | API (prefijo tenant) |
|----|--------|------------|----------------------|
| CU1 | Gestionar usuarios | `apps.usuarios.users` | `/api/auth/`, usuarios |
| CU2 | Inicio de sesión | `apps.usuarios.users` | `/api/auth/login/` |
| CU3 | Roles | `apps.usuarios.roles` | `/api/roles/` |
| CU4 | Permisos | `apps.usuarios.permisos` | `/api/permisos/` |
| CU5 | Perfil | `apps.usuarios.users` | perfil / me |

---

## Paquete: Pacientes

| CU | Nombre | App Django | API |
|----|--------|------------|-----|
| CU6 | Bitácora | `apps.bitacora` | `/api/bitacora/` |
| CU7 | Pacientes | `apps.pacientes.pacientes` | `/api/pacientes/` |
| CU8 | Historial clínico | `apps.pacientes.historial_clinico` + submódulos | `/api/historias-clinicas/...` |

---

## Paquete: Atención clínica

| CU | App | API |
|----|-----|-----|
| CU9 | `apps.atencionClinica.consultas` | `/api/consultas/` |
| CU10 | `apps.atencionClinica.medicion_visual` | `/api/medicion-visual/` |
| CU11 | `apps.atencionClinica.citas` | `/api/citas/` |
| CU12–CU15 | evaluación quirúrgica, preoperatorio, cirugías, postoperatorio | rutas respectivas |

---

## Paquete: CRM

| CU | Nombre | App Django | API |
|----|--------|------------|-----|
| CU16 | CRM comunicación | `apps.crm` | `/api/crm-segmentaciones/`, `crm-campanas/`, `crm-contactos/` |
| **CU17** | **Recordatorios automáticos** | `apps.notificaciones.automatizaciones` | `/api/notificaciones/automatizaciones/` |

> **No** usar CU17 para reportes. Los reportes CSV legacy en `apps.crm.reportes` se tratan como parte de **CU21** (ver abajo).

---

## Paquete: Administrativa y financiera

| CU | Nombre | App Django | API |
|----|--------|------------|-----|
| **CU18** | Seguros y convenios | `apps.seguros` | `/api/seguros/` |
| **CU19** | Descuentos y campañas clínicas | `apps.descuentos` | `/api/descuentos/` |
| **CU20** | Facturación, cobros y pasarela | `apps.facturacion` | `/api/facturacion/` |

**Estado backend (2026-05-23):** cerrado sin UI — catálogo, preview/emitir, cobros, pasarela mock, PDF, push paciente, resumen por cita.

**Endpoints CU20 clave:**

| Método | Ruta |
|--------|------|
| POST | `facturas/preview/`, `facturas/emitir/` |
| POST | `facturas/{id}/registrar-cobro/`, `anular/`, `iniciar-pago-en-linea/` |
| GET | `facturas/{id}/comprobante/` (PDF), `facturas/mis-pendientes/` (paciente) |
| POST | `cobros/confirmar-pasarela/` (header `X-Pasarela-Secret`) |
| GET | `pasarela/mock-checkout/{referencia}/` |
| GET | `citas/{id}/resumen-facturacion/` |

**Integración:** `apps.facturacion.services` llama a CU18 (`verificar_cobertura_paciente`) y CU19 (`listar_beneficios_aplicables`).

**Distinto de:** suscripción SaaS / Stripe (schema `public`, no es CU20).

---

## Paquete: Reportes

| CU | Nombre | Implementación | API |
|----|--------|----------------|-----|
| **CU21** | Generar y exportar reportes | `apps.crm.reportes` (reportes operativos CSV) + motor QBE `apps.reportes` (execute/export) | `/api/reportes/...`, `/api/reportes-qbe/...` |
| **CU22** | Informes personalizados | `apps.reportes` plantillas `is_system_report=False` + UI web `/reportes` | plantillas QBE, guardar, Excel |

Predefinidos del sistema (`is_system_report=True`) se consideran **parte de CU21** (exportación/plantillas sistema).

---

## Paquete: Inteligencia artificial

| CU | Nombre | App | API |
|----|--------|-----|-----|
| CU23 | Asistente / NL → reporte | `apps.ia` | `/api/ia/nlp-to-report/` |
| CU24–CU25 | Urgencia chatbot / derivación | pendiente / parcial | — |

---

## Historial de numeración (evitar confusiones)

| Antes (chat/docs viejos) | Ahora (PUDS §3.10) |
|--------------------------|---------------------|
| CU18 recordatorios | **CU17** |
| CU19 seguros | **CU18** |
| CU20 descuentos | **CU19** |
| CU21 facturación | **CU20** |
| CU22 reportes predefinidos | **CU21** (+ CU22 personalizados) |

---

## Orden sugerido según tus diagramas §3.10 (solo backend, sin frontend)

Paquetes ya avanzados: **Administrativa** CU18–CU20 (backend).

| Siguiente | Paquete | CU | Estado |
|-----------|---------|-----|--------|
| **1** | Reportes | **CU21** | Parcial — CSV + QBE; falta cerrar motor/whitelist |
| **2** | Reportes | **CU22** | Parcial — plantillas personalizadas + web `/reportes` |
| **3** | IA | **CU23** | Parcial — NL → reporte (Gemini) |
| **4** | IA | **CU24** | No implementado — urgencia chatbot |
| **5** | IA | **CU25** | No implementado — derivar a humano |
| — | Atención clínica | **CU26** | Revisar — recetas/indicaciones descargables |
| — | CRM | **CU17** | Parcial — recordatorios (cron/UI pendiente) |

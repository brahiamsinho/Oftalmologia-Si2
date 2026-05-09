# HANDOFF / SESIÓN: Adaptación del Frontend Web al Modelo Multi-Tenant

**Fecha:** 2026-05-09  
**Rama:** `rediseño/Frontend`  
**Afecta:** Frontend Web (Next.js). El equipo Mobile (Flutter) debe leer la Sección 5.

---

## 1. Qué es Multi-Tenant y por qué fue necesario este cambio

**Multi-Tenant** (multi-inquilino / multi-empresa) significa que **un solo sistema atiende a múltiples clínicas**, pero los datos de cada clínica están **aislados entre sí**. En este proyecto, cada clínica (tenant) tiene su propio schema de PostgreSQL.

Antes del cambio, todas las peticiones al backend iban a:
```
GET http://localhost:8000/api/pacientes/
```
Después del cambio, todas las peticiones privadas van a:
```
GET http://localhost:8000/t/clinica-vision/api/pacientes/
```
Donde `clinica-vision` es el **slug** (identificador único) de la clínica. Sin este prefijo, el backend responde con error.

---

## 2. Endpoints clave que el frontend consume (y que el Mobile también necesita)

| Endpoint | Método | Autenticación | Descripción |
|---|---|---|---|
| `/api/tenants/<slug>/` | GET | Ninguna (pública) | Valida que el workspace existe. Devuelve nombre, colores, logo, plan. |
| `/t/<slug>/api/auth/login/` | POST | Ninguna | Login con `email` + `password`. |
| `/t/<slug>/api/auth/me/` | GET | JWT Bearer | Usuario autenticado actual. |
| `/t/<slug>/api/organization/me/` | GET | JWT Bearer | Datos del tenant actual (nombre, plan, límites). |
| `/t/<slug>/api/pacientes/` | GET/POST | JWT Bearer | CRUD de pacientes. |
| `/t/<slug>/api/citas/` | GET/POST | JWT Bearer | CRUD de citas. |
| `/t/<slug>/api/usuarios/` | GET/POST | JWT Bearer | CRUD de usuarios. |

**Regla general:** Toda ruta que no sea `/api/tenants/<slug>/` o `/api/health/` requiere el prefijo `/t/<slug>/api/`.

---

## 3. Implementado en esta sesión (Web Frontend)

### A. `lib/api.ts` — TenantStorage + Interceptor de Red Dinámico

**Problema original:** El frontend llamaba siempre a `/api/...`. No funcionaba con el backend multi-tenant.

**Solución aplicada:** En lugar de reescribir cada componente, se añadió un **interceptor de Axios** que detecta si hay un tenant activo y reescribe la URL automáticamente en cada request.

**Piezas añadidas:**

```typescript
// Guarda el slug del tenant en localStorage + cookie
export const TenantStorage = {
  getSlug()          // → "clinica-vision" | null
  getTenantData()    // → { nombre, branding, subscription } | null
  setSlug(slug)      // guarda
  setTenantData(data)// guarda datos del tenant (nombre, colores, plan)
  clear()            // limpia al hacer logout
};

// Helpers para construir URLs
export function resolveApiOrigin(): string      // "http://localhost:8000"
export function resolveTenantBaseUrl(slug): string // "http://localhost:8000/t/clinica-vision/api"
```

**El interceptor (dentro de `api.interceptors.request.use`):**
```
Cuando llega un request:
  ¿Hay slug guardado? (TenantStorage.getSlug())
    SÍ → reescribe baseURL a http://host/t/<slug>/api
    NO → usa baseURL original (http://host/api)
```
Resultado: `GET pacientes/` con slug `clinica-vision` → `GET /t/clinica-vision/api/pacientes/`.

**Importante:** El interceptor **solo cambia requests que pasan por la instancia `api` de Axios**. El lookup público del tenant (paso 1 del login) usa `axios` directamente para evitar interferencia.

**El refresh de token** también fue actualizado para usar el prefijo del tenant si está activo.

---

### B. `login/page.tsx` — Flujo 2 pasos estilo Slack

**Antes:** El usuario veía un formulario único con email + contraseña. No había concepto de clínica.

**Ahora:** El login tiene 2 pasos:

**Paso 1 — Ingresa el Workspace:**
- El usuario escribe el slug de su clínica (ej: `clinica-vision`).
- Se llama a `GET /api/tenants/clinica-vision/` (sin autenticación, sin prefijo de tenant).
- Si existe y está activo: se guarda el slug + datos de branding en `TenantStorage` y se avanza al Paso 2.
- Si no existe: se muestra un error.

**Paso 2 — Ingresa tus credenciales:**
- Se muestra el nombre de la clínica, su logo y su color primario (personalización dinámica).
- El usuario escribe email y contraseña.
- Se llama a `POST auth/login/` — el interceptor automáticamente lo convierte en `POST /t/clinica-vision/api/auth/login/`.
- El token JWT se guarda con `TokenStorage.setTokens()`.

**Respuesta de `GET /api/tenants/<slug>/`** (shape relevante):
```json
{
  "id": 3,
  "slug": "clinica-vision",
  "nombre": "Clínica Visión",
  "branding": {
    "nombre": "Clínica Visión",
    "logo_url": "http://...",
    "color_primario": "#1e40af",
    "color_secundario": "#0f172a"
  },
  "subscription": {
    "plan": {
      "codigo": "PLUS",
      "nombre": "Plus",
      "max_usuarios": 15,
      "max_pacientes": 2000,
      "max_citas_mes": 1500,
      "permite_crm": true,
      "permite_notificaciones": true,
      "permite_reportes_avanzados": false,
      "permite_soporte_prioritario": false
    },
    "estado": "ACTIVA",
    "esta_activa": true
  }
}
```

---

### C. `lib/services/auth.ts` — Limpieza de tenant al cerrar sesión

Al llamar a `authService.logout()`, ahora se limpia tanto el JWT como el slug del tenant:
```typescript
TokenStorage.clear();   // borra access_token, refresh_token
TenantStorage.clear();  // borra tenant_slug, tenant_data
```
Esto evita que al cerrar sesión y volver al login, el sistema intente conectarse al tenant anterior.

---

### D. `usuarios/page.tsx` — Restricción por límite del plan

Al cargar la página, se consulta el plan del tenant:
```typescript
api.get('organization/me/')  // → /t/<slug>/api/organization/me/
  .then(res => setPlanInfo(res.data.subscription?.plan))
```
Se computan dos estados:
- `atUserLimit` = `total >= planInfo.max_usuarios`
- `nearLimit`   = `total == planInfo.max_usuarios - 1`

**Visual:**
- 🟢 Normal: botón "Nuevo Usuario" azul y activo.
- 🟡 `nearLimit`: banner amarillo de advertencia.
- 🔴 `atUserLimit`: botón deshabilitado + tooltip + banner rojo con link a `/planes`.
- La tarjeta de stat "Total" muestra `X/Y` y cambia de color.

---

### E. `pacientes/page.tsx` — Restricción por límite del plan

Mismo patrón que Usuarios, aplicado con `max_pacientes`:
- Consulta `organization/me/` al montar.
- Computa `atPatientLimit` y `nearPatientLimit`.
- Deshabilita "Nuevo Paciente" si se alcanza el límite.
- Banners informativos y tarjeta con `X/Y`.

---

### F. Backend: `CitaViewSet` — Soporte de filtro por fecha

Para poder calcular citas del mes actual, se añadió soporte para `?fecha_desde=YYYY-MM-DD` y `?fecha_hasta=YYYY-MM-DD` en `get_queryset()` del `CitaViewSet`.

---

### G. `citas-agenda/page.tsx` — Restricción por límite mensual del plan

Se calcula el conteo de citas del mes actual haciendo:
```typescript
citasService.list({ fecha_desde: primerDiaMes, fecha_hasta: ultimoDiaMes })
```
Se comparan con `max_citas_mes` del plan. Mismo patrón visual que Usuarios/Pacientes.

---

### H. `lib/api.ts` — Interceptor de respuesta 403 (tenant inactivo/suspendido)

Si el backend responde con `403` y el body contiene una referencia al tenant, el sistema:
1. Limpia `TenantStorage`.
2. Limpia `TokenStorage`.
3. Redirige al login con un mensaje de error.

---

### I. `planes/page.tsx` — Conectada con el backend real

La página de planes ahora:
1. Carga los planes disponibles desde `GET /api/plans/` (endpoint público).
2. Carga el plan actual del tenant desde `GET organization/me/`.
3. El botón "Mejorar Plan" dispara un modal de confirmación que llama a `POST organization/change-plan/`.

---

## 4. Flujo completo del sistema (mapa mental)

```
Usuario abre la app
       ↓
  ¿Hay tenant_slug en localStorage?
       ↓ SÍ                    ↓ NO
  ¿Hay access_token?       Paso 1: ingresa slug
       ↓ SÍ                    ↓
  GET /t/<slug>/api/auth/me/   GET /api/tenants/<slug>/
       ↓                           ↓
  ¿200? → dashboard          ¿200? → guarda slug + branding
  ¿401? → refresh                   → Paso 2: ingresa credenciales
  ¿403? → limpiar y login            ↓
                              POST /t/<slug>/api/auth/login/
                                     ↓
                              Guarda JWT → dashboard
```

---

## 5. GUÍA PARA EL DESARROLLADOR MOBILE (Flutter)

Esta sección es **obligatoria** para el equipo que trabaja en la app Flutter.

### 5.1 El problema exacto que hay que resolver

La app Flutter actualmente usa un cliente HTTP (Dio o http package) con una `baseUrl` fija que apunta a `/api/`. En el nuevo modelo multi-tenant, esto falla 100% en endpoints privados porque la `baseUrl` debe ser `/t/<slug>/api/`.

### 5.2 La solución equivalente en Flutter

**Paso 1:** Crear pantalla de selección de clínica antes del login.

```dart
// Pantalla: WorkspaceScreen (nueva)
// Se muestra ANTES de LoginScreen
// El usuario escribe el slug de su clínica

Future<void> lookupTenant(String slug) async {
  // IMPORTANTE: usar la baseUrl pública, sin prefijo de tenant
  // Ejemplo: GET http://tu-backend.com/api/tenants/clinica-vision/
  final response = await dio.get('/api/tenants/$slug/');
  // Guardar en SharedPreferences: tenant_slug, tenant_nombre, colores
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('tenant_slug', response.data['slug']);
  await prefs.setString('tenant_data', jsonEncode(response.data));
  // Navegar a LoginScreen
}
```

**Paso 2:** Crear un interceptor de Dio para inyectar el prefijo `/t/<slug>/api/`.

```dart
// TenantInterceptor: aplica a TODOS los requests privados
class TenantInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final prefs = await SharedPreferences.getInstance();
    final slug = prefs.getString('tenant_slug');
    
    // Rutas que NO necesitan prefijo de tenant:
    final isPublicRoute = options.path.contains('/api/tenants/') ||
                          options.path.contains('/api/health/');
    
    if (slug != null && !isPublicRoute) {
      // Reescribir la baseUrl: "http://host/api" → "http://host/t/<slug>/api"
      final origin = options.baseUrl.replaceAll(RegExp(r'/api/?$'), '');
      options.baseUrl = '$origin/t/$slug/api';
    }
    
    handler.next(options);
  }
}
```

**Paso 3:** Registrar el interceptor en el cliente Dio.

```dart
// En AppConfig o DioFactory (donde se construye el cliente HTTP)
final dio = Dio();
dio.interceptors.add(TenantInterceptor());
dio.interceptors.add(AuthInterceptor()); // el que agrega el Bearer token
```

**Paso 4:** Al hacer logout, limpiar el slug del tenant.

```dart
Future<void> logout() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('tenant_slug');
  await prefs.remove('tenant_data');
  await prefs.remove('access_token');
  await prefs.remove('refresh_token');
  // Navegar a WorkspaceScreen (no directamente a LoginScreen)
}
```

### 5.3 Estructura de navegación recomendada para Mobile

```
App inicia
    ↓
WorkspaceScreen   ← NUEVA (solicita el slug de la clínica)
    ↓ (slug válido guardado)
LoginScreen       ← EXISTENTE (solo email + password)
    ↓ (JWT guardado)
HomeScreen        ← EXISTENTE (dashboard del staff/paciente)
```

### 5.4 Personalización visual dinámica (branding del tenant)

El response de `GET /api/tenants/<slug>/` incluye:
```json
"branding": {
  "nombre": "Clínica Visión",
  "logo_url": "http://...",         // puede ser null
  "color_primario": "#1e40af",      // hex color para botones/accents
  "color_secundario": "#0f172a"     // hex color para fondos oscuros
}
```

Se recomienda que la app Flutter:
1. Muestre el nombre/logo en la pantalla de `WorkspaceScreen`.
2. Use `color_primario` como `primaryColor` del `ThemeData` durante la sesión.
3. El `LoginScreen` (Paso 2) muestre el nombre de la clínica en el header.

### 5.5 Manejo de errores de tenant

| Código HTTP | Causa | Acción en la app |
|---|---|---|
| `404` en `/api/tenants/<slug>/` | Slug incorrecto o clínica inexistente | Mostrar error en WorkspaceScreen |
| `403` en cualquier endpoint privado | Tenant suspendido o inactivo | Limpiar storage + redirigir a WorkspaceScreen |
| `401` en endpoint privado | Token expirado | Intentar refresh; si falla, redirigir a LoginScreen |

### 5.6 Límites del plan en la UI Mobile

El plan del tenant tiene límites que también deberían respetarse en la app mobile:

```dart
// Obtener el plan activo (requiere auth):
// GET /t/<slug>/api/organization/me/
// Devuelve: { "subscription": { "plan": { "max_usuarios": 15, ... } } }

// Para restricciones de creación, usar estos campos:
final maxUsuarios   = plan['max_usuarios'];    // límite absoluto
final maxPacientes  = plan['max_pacientes'];   // límite absoluto
final maxCitasMes   = plan['max_citas_mes'];   // límite mensual
```

Si la app tiene módulos de creación de pacientes o agendamiento de citas, debe:
- Verificar contra el plan antes de mostrar el formulario de creación.
- Mostrar un mensaje claro si se alcanzó el límite.

### 5.7 Archivo que debes leer para entender el interceptor web equivalente

Ver: `frontend/src/lib/api.ts` — el `TenantStorage` y el bloque `api.interceptors.request.use(...)`.
La lógica es idéntica en concepto: si hay slug → reescribir baseUrl.

---

## 6. Siguiente prioridad técnica sugerida

| Prioridad | Tarea |
|---|---|
| Alta | Mobile: implementar WorkspaceScreen + TenantInterceptor de Dio |
| Alta | Web: restricciones de plan en módulos de CRM y Notificaciones |
| Media | Web/Mobile: mostrar alerta si el tenant es TRIAL y está por vencer |
| Media | Web: validar límite de almacenamiento en subida de archivos (mediciones) |
| Baja | Web/Mobile: flujo de recuperación de contraseña adaptado al tenant |

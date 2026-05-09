# feat: implementar multi-tenant con django-tenants y scope por clínica

## Resumen

Esta PR cambia el enfoque multi-tenant del proyecto para usar `django-tenants` de forma más completa, reemplazando el scope manual/legacy que se había implementado anteriormente para manejar el tenant de forma directa en modelos, managers y filtros.

El objetivo del cambio es que cada clínica/empresa trabaje dentro de su propio schema de PostgreSQL, usando URLs con prefijo de tenant:

```txt
/t/<slug-clinica>/api/...
```

Por ejemplo:

```txt
/t/clinica-demo/api/auth/login/
/t/clinica-demo/api/users/
/t/clinica-demo/api/organization/settings/
```

Antes del cambio, las URLs eran directas:

```txt
/api/auth/login/
/api/users/
/api/citas/
```

Ahora, para operar dentro de una clínica específica, el frontend debe llamar los endpoints dentro del scope del tenant:

```txt
/t/clinica-demo/api/auth/login/
/t/clinica-demo/api/citas/
/t/clinica-demo/api/pacientes/
```

Esto permite que `django-tenants` resuelva automáticamente el schema correspondiente antes de ejecutar las consultas.

---

## Cambio de enfoque

### Antes

El proyecto tenía una lógica más manual para manejar tenants, basada en:

- Filtros por tenant en queries.
- Uso de managers tipo `TenantManager`.
- Resolución manual de tenant en modelos o vistas.
- Riesgo de mezclar datos si algún query no aplicaba correctamente el filtro.
- URLs directas sin contexto claro de clínica.

Ejemplo anterior:

```txt
/api/auth/login/
/api/users/
/api/citas/
```

### Ahora

Se adopta `django-tenants` como enfoque principal:

- Cada clínica tiene su propio schema.
- El middleware `TenantSubfolderMiddleware` resuelve el tenant desde la URL.
- Las apps compartidas viven en `public`.
- Las apps propias de cada clínica viven dentro del schema de cada tenant.
- El login, usuarios, pacientes, citas, bitácora, notificaciones, CRM, etc. quedan separados por clínica.

Ejemplo nuevo:

```txt
/t/clinica-demo/api/auth/login/
/t/clinica-demo/api/users/
/t/clinica-demo/api/citas/
```

---

## Configuración principal agregada/modificada

Se reorganizó `settings.py` para trabajar con `django-tenants`:

```python
TENANT_MODEL = 'tenant.Tenant'
TENANT_DOMAIN_MODEL = 'tenant.Domain'

PUBLIC_SCHEMA_NAME = 'public'
TENANT_SUBFOLDER_PREFIX = 't'

PUBLIC_SCHEMA_URLCONF = 'config.urls_public'
```

También se separaron las apps en:

### `SHARED_APPS`

Apps que viven en el schema público:

```python
SHARED_APPS = [
    'django_tenants',
    'apps.tenant',

    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',

    'apps.core',
]
```

### `TENANT_APPS`

Apps que viven dentro de cada clínica:

```python
TENANT_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.admin',
    'django.contrib.staticfiles',

    'rest_framework_simplejwt.token_blacklist',

    'apps.usuarios.users',
    'apps.usuarios.permisos',
    'apps.usuarios.roles',

    'apps.bitacora',

    'apps.pacientes.pacientes',
    'apps.pacientes.historial_clinico',

    'apps.atencionClinica.especialistas',
    'apps.atencionClinica.antecedentes',
    'apps.atencionClinica.citas',
    'apps.atencionClinica.consultas',
    'apps.atencionClinica.medicion_visual',
    'apps.atencionClinica.evaluacion_quirurgica',
    'apps.atencionClinica.preoperatorio',
    'apps.atencionClinica.cirugias',
    'apps.atencionClinica.postoperatorio',

    'apps.crm',

    'apps.notificaciones',
    'apps.notificaciones.automatizaciones',
]
```

---

## Cambios en base de datos y schemas

Con este enfoque es normal que el schema `public` tenga menos tablas que antes, porque ahora solo debe guardar lo compartido, principalmente:

- Tenants.
- Domains.
- Planes.
- Suscripciones.
- Configuración global o metadata compartida.
- Tablas necesarias para resolver tenants.

En cambio, cada schema de clínica debe tener sus propias tablas operativas:

- Usuarios.
- Roles.
- Permisos.
- Pacientes.
- Citas.
- Consultas.
- Bitácora.
- CRM.
- Notificaciones.
- Etc.

Por ejemplo:

```txt
public
  tenant_tenants
  tenant_domains
  subscription_plans
  tenant_subscriptions
  tenant_usage
  tenant_settings

clinica_demo
  users
  pacientes
  citas
  consultas
  bitacora
  roles
  permisos
  ...
```

---

## Nuevos endpoints de tenant / organización

### 1. Obtener datos públicos del tenant actual

```http
GET /t/<slug>/api/organization/me/
```

Ejemplo:

```http
GET /t/clinica-demo/api/organization/me/
```

Respuesta esperada:

```json
{
  "id": 1,
  "id_tenant": 1,
  "schema_name": "clinica_demo",
  "slug": "clinica-demo",
  "nombre": "Clínica Demo",
  "activo": true,
  "dominio": "clinica-demo",
  "is_public": false,
  "url_prefix": "/t/clinica-demo/",
  "branding": {
    "nombre": "Clínica Demo",
    "logo_url": null,
    "color_primario": "#2563eb",
    "color_secundario": "#0f172a"
  },
  "config": {},
  "settings": {},
  "subscription": {}
}
```

Uso en frontend:

- Cargar nombre de la clínica.
- Cargar logo.
- Cargar colores.
- Cargar flags/configuración.
- Validar si la clínica está activa.

---

### 2. Obtener tenant desde auth antes del login

```http
GET /t/<slug>/api/auth/tenant/
```

Ejemplo:

```http
GET /t/clinica-demo/api/auth/tenant/
```

Respuesta:

```json
{
  "tenant": {
    "id": 1,
    "id_tenant": 1,
    "schema_name": "clinica_demo",
    "slug": "clinica-demo",
    "nombre": "Clínica Demo",
    "branding": {
      "nombre": "Clínica Demo",
      "logo_url": null,
      "color_primario": "#2563eb",
      "color_secundario": "#0f172a"
    },
    "config": {}
  }
}
```

Este endpoint sirve para que el frontend pueda pintar la pantalla de login según la clínica antes de autenticar al usuario.

---

### 3. Login dentro de una clínica

```http
POST /t/<slug>/api/auth/login/
```

Ejemplo:

```http
POST /t/clinica-demo/api/auth/login/
```

Body:

```json
{
  "email": "brandon@gmail.com",
  "password": "Felipe321"
}
```

Respuesta:

```json
{
  "usuario": {
    "id": 6,
    "username": "brandon",
    "email": "brandon@gmail.com",
    "nombres": "María",
    "apellidos": "García López",
    "tipo_usuario": "PACIENTE",
    "estado": "ACTIVO"
  },
  "tenant": {
    "id": 1,
    "id_tenant": 1,
    "schema_name": "clinica_demo",
    "slug": "clinica-demo",
    "nombre": "Clínica Demo",
    "branding": {
      "nombre": "Clínica Demo",
      "logo_url": null,
      "color_primario": "#2563eb",
      "color_secundario": "#0f172a"
    },
    "config": {}
  },
  "access": "...",
  "refresh": "..."
}
```

El token JWT ahora también puede incluir claims de tenant:

```json
{
  "tenant_id": 1,
  "tenant_schema": "clinica_demo",
  "tenant_slug": "clinica-demo"
}
```

---

### 4. Modificar configuración del tenant actual

Endpoint nuevo para que un usuario ADMIN o ADMINISTRATIVO de una clínica pueda modificar la configuración de su propia organización:

```http
GET /t/<slug>/api/organization/settings/
PATCH /t/<slug>/api/organization/settings/
PUT /t/<slug>/api/organization/settings/
```

Ejemplo:

```http
PATCH /t/clinica-demo/api/organization/settings/
Authorization: Bearer <access_token>
```

Body:

```json
{
  "branding_nombre": "Clínica Demo Oftalmológica",
  "branding_color_primario": "#2563eb",
  "branding_color_secundario": "#0f172a",
  "branding_logo_url": "https://example.com/logo.png",
  "timezone": "America/La_Paz",
  "idioma": "es",
  "flags": {
    "permite_reserva_online": true,
    "mostrar_modulo_crm": true,
    "mostrar_notificaciones": true
  }
}
```

Respuesta:

```json
{
  "mensaje": "Configuración de organización actualizada correctamente.",
  "settings": {
    "id_tenant_settings": 1,
    "timezone": "America/La_Paz",
    "idioma": "es",
    "branding_nombre": "Clínica Demo Oftalmológica",
    "branding_color_primario": "#2563eb",
    "branding_color_secundario": "#0f172a",
    "branding_logo_url": "https://example.com/logo.png",
    "flags": {
      "permite_reserva_online": true,
      "mostrar_modulo_crm": true,
      "mostrar_notificaciones": true
    }
  },
  "tenant": {
    "id": 1,
    "schema_name": "clinica_demo",
    "slug": "clinica-demo",
    "nombre": "Clínica Demo",
    "branding": {
      "nombre": "Clínica Demo Oftalmológica",
      "logo_url": "https://example.com/logo.png",
      "color_primario": "#2563eb",
      "color_secundario": "#0f172a"
    },
    "config": {
      "permite_reserva_online": true,
      "mostrar_modulo_crm": true,
      "mostrar_notificaciones": true
    }
  }
}
```

Códigos relevantes:

```txt
200 OK      Configuración obtenida o actualizada correctamente.
400 Bad Request si se intenta usar fuera de una organización.
401 Unauthorized si no hay token.
403 Forbidden si el usuario no tiene rol permitido.
```

---

### 5. Cambiar plan del tenant actual

```http
POST /t/<slug>/api/organization/change-plan/
```

Ejemplo:

```http
POST /t/clinica-demo/api/organization/change-plan/
Authorization: Bearer <access_token>
```

Body:

```json
{
  "plan": "PLUS",
  "renovar_automaticamente": true,
  "proveedor_pago": "manual",
  "referencia_pago": "PAGO-001",
  "notas": "Cambio solicitado desde administración de clínica"
}
```

Para downgrade:

```json
{
  "plan": "FREE",
  "confirmar_downgrade": true
}
```

Respuesta esperada:

```json
{
  "id": 1,
  "id_tenant": 1,
  "schema_name": "clinica_demo",
  "slug": "clinica-demo",
  "nombre": "Clínica Demo",
  "subscription": {
    "id_suscripcion": 1,
    "plan": {
      "codigo": "PLUS",
      "nombre": "Plus"
    },
    "estado": "ACTIVA",
    "renovar_automaticamente": true,
    "esta_activa": true
  },
  "usage": {
    "usuarios_actuales": 3,
    "pacientes_actuales": 20,
    "citas_mes_actual": 15,
    "almacenamiento_usado_mb": 100
  }
}
```

Códigos relevantes:

```txt
200 OK      Plan actualizado.
400 Bad Request si se usa fuera de un tenant o si el uso actual supera los límites del plan.
401 Unauthorized si no hay token.
403 Forbidden si el usuario no tiene permisos.
```

---

### 6. Buscar tenant por slug antes de entrar al scope

```http
GET /api/tenants/<slug>/
```

Ejemplo:

```http
GET /api/tenants/clinica-demo/
```

Uso previsto:

El frontend puede tener una pantalla inicial donde el usuario escriba o seleccione su clínica. Luego se consulta:

```txt
/api/tenants/clinica-demo/
```

Si existe, el frontend redirige a:

```txt
/t/clinica-demo/login
```

Y desde ahí empieza a consumir:

```txt
/t/clinica-demo/api/...
```

---

## Flujo esperado desde frontend

Este cambio también debe estudiarse y diseñarse en el frontend, porque ya no basta con consumir `/api/...` directamente.

### Flujo recomendado

#### 1. Selección o detección de clínica

Opción A: el usuario entra directamente a una URL con tenant:

```txt
/t/clinica-demo/login
```

Opción B: el usuario escribe el slug de su clínica:

```txt
clinica-demo
```

Y el frontend consulta:

```http
GET /api/tenants/clinica-demo/
```

Si existe, redirige a:

```txt
/t/clinica-demo/login
```

---

#### 2. Cargar configuración visual antes del login

```http
GET /t/clinica-demo/api/auth/tenant/
```

El frontend guarda temporalmente:

```ts
tenant.slug;
tenant.nombre;
tenant.branding.logo_url;
tenant.branding.color_primario;
tenant.branding.color_secundario;
tenant.config;
```

Con esto puede pintar:

- Nombre de la clínica.
- Logo.
- Colores.
- Flags de módulos visibles.
- Configuración de experiencia.

---

#### 3. Login dentro del tenant

```http
POST /t/clinica-demo/api/auth/login/
```

Body:

```json
{
  "email": "brandon@gmail.com",
  "password": "Felipe321"
}
```

El frontend debe guardar:

```ts
access_token;
refresh_token;
tenant.slug;
tenant.schema_name;
tenant.id;
usuario;
```

---

#### 4. Consumir endpoints siempre con el prefijo del tenant

Antes:

```txt
/api/users/
/api/citas/
/api/pacientes/
```

Ahora:

```txt
/t/clinica-demo/api/users/
/t/clinica-demo/api/citas/
/t/clinica-demo/api/pacientes/
```

Ejemplo en frontend:

```ts
const tenantSlug = currentTenant.slug;

const apiBaseUrl = `${BACKEND_URL}/t/${tenantSlug}/api`;

await http.get(`${apiBaseUrl}/users/`);
await http.get(`${apiBaseUrl}/citas/`);
await http.patch(`${apiBaseUrl}/organization/settings/`, body);
```

---

#### 5. Admin de clínica

Un usuario con rol ADMIN o ADMINISTRATIVO dentro de su clínica puede:

- Crear usuarios:

```http
POST /t/clinica-demo/api/users/
```

- Cambiar configuración de su tenant:

```http
PATCH /t/clinica-demo/api/organization/settings/
```

- Cambiar plan de su clínica:

```http
POST /t/clinica-demo/api/organization/change-plan/
```

---

## Cómo crear un tenant desde cero

### 1. Crear migraciones normalmente

```bash
python manage.py makemigrations
```

### 2. Aplicar migraciones del schema público

```bash
python manage.py migrate_schemas --shared
```

Esto crea las tablas compartidas en `public`.

### 3. Crear el tenant público si aplica

```bash
python manage.py bootstrap_public_tenant --domain localhost
```

### 4. Crear planes / seeders compartidos

Ejecutar los seeders necesarios para:

- Planes.
- Configuración base.
- Tenants iniciales, si aplica.

### 5. Crear un tenant nuevo

Desde endpoint de administración central:

```http
POST /api/tenants/
Authorization: Bearer <access_token_superadmin>
```

Body:

```json
{
  "slug": "clinica-demo",
  "nombre": "Clínica Demo",
  "razon_social": "Clínica Demo S.R.L.",
  "nit": "123456789",
  "email_contacto": "admin@clinicademo.com",
  "telefono_contacto": "+59170000000",
  "plan": "FREE",
  "trial_days": 14
}
```

Esto debería crear:

- Registro en `tenant_tenants`.
- Registro en `tenant_domains`.
- `TenantSettings`.
- `TenantSubscription`.
- `TenantUsage`.
- Schema PostgreSQL correspondiente:

```txt
clinica_demo
```

### 6. Migrar schemas de tenants

```bash
python manage.py migrate_schemas --tenant
```

Esto crea las tablas internas en cada tenant.

### 7. Ejecutar seeders del tenant

Después de crear/migrar el tenant, se deben correr seeders dentro del schema correspondiente para crear:

- Usuario admin de clínica.
- Roles.
- Permisos.
- Tipos de cita.
- Datos demo, si aplica.

Ejemplo conceptual:

```bash
python manage.py seed_tenant --schema=clinica_demo
```

El nombre exacto del comando puede variar según el management command disponible en el proyecto.

---

## Cambios en login y JWT

Se modificó la respuesta del login para incluir información del tenant actual:

```json
{
  "usuario": {},
  "tenant": {},
  "access": "...",
  "refresh": "..."
}
```

Además, el refresh token puede incluir claims de tenant:

```json
{
  "tenant_id": 1,
  "tenant_schema": "clinica_demo",
  "tenant_slug": "clinica-demo"
}
```

Esto ayuda al frontend a mantener contexto de clínica, pero el aislamiento real lo sigue haciendo `django-tenants` por la URL y el schema activo.

---

## Dockerfile y entrypoint

También actualicé el `Dockerfile` y el `entrypoint.sh`.

El contenedor ahora debería encargarse de:

1. Esperar PostgreSQL.
2. Asegurar que exista el schema `public` si fue eliminado.
3. Ejecutar migraciones compartidas:

```bash
python manage.py migrate_schemas --shared --noinput
```

4. Asegurar el tenant público:

```bash
python manage.py bootstrap_public_tenant --domain "${PUBLIC_DOMAIN:-localhost}"
```

5. Ejecutar migraciones de tenants:

```bash
python manage.py migrate_schemas --tenant --noinput
```

6. Ejecutar seeders configurados para datos iniciales.
7. Ejecutar `collectstatic`.

### Nota importante

No pude probar completamente el Dockerfile ni el entrypoint en mi pc porque actualmente Docker no está funcionando correctamente en mi mierda.

Sería bueno que alguien pueda levantar el contenedor y avisarme por aquí si aparece algún error, así puedo corregirlo mientras termino de arreglar Docker en mi máquina

Comando esperado:

```bash
docker-compose up --build
```

---

## Migraciones a partir de ahora

Con `django-tenants`, ya no se recomienda usar únicamente:

```bash
python manage.py migrate
```

Ahora el flujo correcto es:

```bash
python manage.py makemigrations
python manage.py migrate_schemas --shared
python manage.py migrate_schemas --tenant
```

Cuando se agrega una app nueva:

- Si la app es global, debe ir en `SHARED_APPS`.
- Si la app pertenece a cada clínica, debe ir en `TENANT_APPS`.
- Si una app está en el lugar incorrecto, puede terminar creando tablas donde no corresponde.

Ejemplo:

```txt
apps.tenant                 -> SHARED_APPS
apps.usuarios.users         -> TENANT_APPS
apps.pacientes.pacientes    -> TENANT_APPS
apps.atencionClinica.citas  -> TENANT_APPS
apps.crm                    -> TENANT_APPS
```

---

## Consideraciones para frontend

Este cambio no es solo backend. El frontend debe adaptarse al nuevo modelo.

Pendientes del frontend:

- Definir cómo se selecciona la clínica.
- Guardar el `tenantSlug`.
- Construir dinámicamente el `apiBaseUrl`.
- Cambiar todas las llamadas `/api/...` por `/t/<tenantSlug>/api/...`.
- Consumir `GET /t/<slug>/api/auth/tenant/` antes del login.
- Usar `tenant.branding` para pintar login/layout.
- Usar `tenant.config` o `settings.flags` para mostrar/ocultar módulos.
- Asegurar que refresh token, logout, users, citas, pacientes y demás endpoints usen siempre la URL del tenant.
- Definir qué pasa si el usuario intenta entrar a una clínica inactiva o inexistente.

Ejemplo de construcción de URL:

```ts
const tenantSlug = localStorage.getItem("tenantSlug");

const apiBaseUrl = `${environment.apiUrl}/t/${tenantSlug}/api`;
```

Ejemplo:

```ts
await http.post(`${apiBaseUrl}/auth/login/`, {
  email,
  password,
});
```

---

## Ejemplo completo de flujo frontend

```txt
1. Usuario entra a /clinicas o /login.
2. Escribe: clinica-demo.
3. Front consulta GET /api/tenants/clinica-demo/.
4. Si existe, redirige a /t/clinica-demo/login.
5. Front consulta GET /t/clinica-demo/api/auth/tenant/.
6. Front pinta logo, colores y nombre de la clínica.
7. Usuario inicia sesión con POST /t/clinica-demo/api/auth/login/.
8. Front guarda access, refresh y tenantSlug.
9. Todas las llamadas posteriores usan /t/clinica-demo/api/...
10. Si el usuario es ADMIN o ADMINISTRATIVO, puede:
    - Crear usuarios.
    - Cambiar plan.
    - Modificar configuración visual/funcional del tenant.
```

---

## Pendientes / cosas a revisar

- Validar completamente el flujo con Docker cuando el entorno esté funcionando.
- Confirmar que los seeders se ejecuten correctamente dentro del schema del tenant y no en `public`.
- Revisar si se necesita un comando específico para crear tenant demo + admin demo automáticamente.
- Revisar en frontend el diseño del nuevo flujo por clínica.
- Revisar que ninguna llamada del frontend quede usando `/api/...` directo para datos propios de una clínica.
- Validar permisos de ADMIN / ADMINISTRATIVO para:
  - Crear usuarios.
  - Cambiar plan.
  - Modificar configuración.

- Revisar si la administración central de tenants requerirá login en `public` o si se manejará por comando/seed inicial.

---

## Resultado esperado

Después de este cambio, el proyecto debería soportar un flujo como:

```txt
Clínica Demo
/t/clinica-demo/api/auth/login/
/t/clinica-demo/api/users/
/t/clinica-demo/api/citas/

Clínica Norte
/t/clinica-norte/api/auth/login/
/t/clinica-norte/api/users/
/t/clinica-norte/api/citas/
```

Cada clínica queda aislada en su propio schema, pero compartiendo la misma base de código y la misma API estructural.

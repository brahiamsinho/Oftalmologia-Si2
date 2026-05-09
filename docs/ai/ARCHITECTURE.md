# ARCHITECTURE

## Arquitectura del Proyecto
Sistema distribuido basado en arquitectura modular **SaaS multi-tenant**. El ecosistema es un Monorepo estructurado en tres vértices (Backend, Frontend Web, Mobile) sustentados por Infraestructura (Docker, DB). Funciona localmente, y está preparado para despliegue en Nube/VM.

## Multi-Tenant: django-tenants con Schema-per-Tenant

### Enfoque
Cada clínica/organización tiene su propio **schema de PostgreSQL**. El aislamiento es a nivel de base de datos, no solo por filtros en queries.

### Cómo funciona
1. **URL con prefijo:** el cliente llama a `/t/<slug-clinica>/api/...`
2. **Middleware** `TenantSubfolderMiddleware` extrae el slug de la URL.
3. **Resolución:** busca el `Domain` o `Tenant` con ese slug.
4. **Cambio de schema:** Django cambia `connection.schema_name` al schema de esa clínica.
5. **Query ejecuta:** todas las consultas van al schema correcto. Las tablas de otra clínica ni existen en el contexto actual.
6. **Respuesta:** los datos devueltos son exclusivamente de esa clínica.

### Schemas
| Schema | Contenido | Ejemplo |
|--------|-----------|---------|
| `public` | Tenants, Domains, Planes, Suscripciones, Settings globales, Core | `tenant_tenants`, `tenant_domains`, `subscription_plans` |
| `clinica_demo` | Usuarios, Pacientes, Citas, Consultas, Bitácora, CRM, Notificaciones | `users`, `pacientes`, `citas`, `consultas` |
| `clinica_norte` | Mismas tablas, datos completamente separados | `users`, `pacientes`, `citas`, `consultas` |

### Apps por capa
- **SHARED_APPS (public):** `django_tenants`, `apps.tenant`, `django.contrib.*`, `rest_framework`, `rest_framework_simplejwt`, `corsheaders`, `django_filters`, `apps.core`
- **TENANT_APPS (por clínica):** auth, sessions, admin, token_blacklist, `apps.usuarios.*`, `apps.bitacora`, `apps.pacientes.*`, `apps.atencionClinica.*` (todas), `apps.crm`, `apps.notificaciones.*`

### URLs separadas
- `config/urls.py` → URLs dentro de tenant scope (`/t/<slug>/api/...`)
- `config/urls_public.py` → URLs en schema public (`/api/...`, `/api/public/...`)

### Flujo de clientes
```
1. Usuario entra a / o selecciona clínica
2. Frontend consulta GET /api/tenants/<slug>/ (público)
3. Si existe, redirige a /t/<slug>/login
4. Frontend consulta GET /t/<slug>/api/auth/tenant/ → obtiene branding
5. Login: POST /t/<slug>/api/auth/login/ → recibe usuario + tenant + tokens
6. Todas las llamadas posteriores: /t/<slug>/api/...
```

## Principios Arquitectónicos
- **Modularidad Total:** Separación por responsabilidades tanto en carpetas como en apps internas de Django.
- **API Universal:** El Backend expone endpoints uniformes utilizados tanto por el canal Web como por el Mobile de manera equivalente y concurrente.
- **Seguridad y UX Base:** Desde la capa más baja se deben establecer validaciones fuertes, sanitización de datos (Backend) y feedback visual, validaciones cliente y prevención de errores (Frontend/Mobile).
- **DRY (Don't Repeat Yourself) & SOLID.**
- **Aislamiento por schema:** los datos de cada clínica están físicamente separados en PostgreSQL. No hay riesgo de fuga cross-tenant por omisión de filtros.

## Reglas que No Deben Romperse
1. Web (`/frontend`) y Mobile (`/mobile`) son meros visualizadores e interactuadores; TODA la lógica de negocio vive aislada en el Backend.
2. Cada aplicación/módulo soluciona un solo dominio (Auth, Pacientes, Turnos).
3. Todas las variables sensibles habitan vía variables de entorno (`.env`), preparadas para escalar a secretos de nube (ej. AWS Secrets). Jamás en commits de código.
4. **Todas las llamadas de clientes a datos de clínica deben usar el prefijo `/t/<slug>/`.** No llamar `/api/...` directo para datos tenant-specific.
5. **Migraciones:** usar `migrate_schemas --shared` y `migrate_schemas --tenant`. Nunca `migrate` solo.
6. **Apps nuevas:** definir si van en `SHARED_APPS` o `TENANT_APPS` antes de crear migraciones.

## Organización Modular y Responsabilidades
- `/backend`: API REST (Django + DRF + django-tenants). Responsable de validación, DB, seguridad JWT, lógica de negocio y aislamiento multi-tenant.
- `/frontend`: Panel Web de Gestión (Next.js). Operadores administrativos. Debe usar URLs con prefijo de tenant.
- `/mobile`: App multiplataforma (Flutter). Interfaz portable pacientes/médicos. Debe usar URLs con prefijo de tenant.
- `/infra` o raíz: Docker, Docker Compose, pipelines de automatización para nube/VM y entorno local.

## Flujo General del Sistema Diferenciado
- **Web Flow:** Browser -> Next.js Render/Fetch -> API Django (tenant resuelto por URL) -> PostgreSQL (schema correcto) -> API Django -> UI State.
- **Mobile Flow:** Dispositivo (iOS/Android) -> Flutter Dio HTTP -> API Django (tenant resuelto por URL) -> PostgreSQL (schema correcto) -> BloC/Provider State -> UI Render.

## Diseño de la API REST (Decisión de Enrutamiento Anidado)
Para maximizar la **seguridad de datos clínicos (HIPAA/Data Leak Prevention)** y la consistencia del estado en el cliente, todas las entidades que le pertenezcan a un perfil maestro deben usar **URLs Anidadas** en lugar de planas.

Ejemplo implementado: Para acceder o crear recetas, diagnósticos o evoluciones, la API requiere la ruta:
`POST /api/historial-clinico/{id}/recetas/`

**Justificación para Agentes/Desarrolladores Futuros:**
1. **Prevención de Fuga de Datos (Escenario GET):** Una URL plana (`GET /api/diagnosticos/`) permitiría que un error u omisión de parámetros en el frontend devuelva datos de todos los pacientes de la base de datos de golpe. La URL anidada fuerza un error 404 si el sistema escanea sin el ID del paciente, bloqueando la filtración.
2. **Prevención de Corrupción de Estado (Escenario POST):** Si un Frontend en React/Flutter sufre un bug y confunde los IDs guardados en caché al cambiar de pestaña entre dos pacientes, una URL libre (`POST /api/recetas/` mandando `"id_historial": X` en el body JSON) guardaría el diagnóstico en el paciente equivocado, incurriendo en negligencia médica grave. Las rutas anidadas inyectan de forma inmutable a quién le pertenece la relación directamente desde la URL principal (`/historial-clinico/{ID_CORRECTO}/`). El backend prioriza el ID de la URL y sobreescribe cualquier ID corrupto enviado en el JSON, y los Middlewares interceptan la solicitud antes de siquiera tocar la vista para corroborar acceso.

**REGLA:** Nunca abstraer o aplanar los submódulos clínicos. Mantener la dependencia en la URL.

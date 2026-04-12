# DECISIONS LOG

Este archivo documenta todas las decisiones técnicas arquitectónicas importantes tomadas en la evolución del proyecto.

## Formato de Registro
- **Fecha:** YYYY-MM-DD
- **Decisión:** Resumen de la decisión técnica.
- **Motivo:** ¿Por qué se tomó y qué alternativas se consideraron?
- **Impacto:** ¿Qué consecuencias operativas o de código implica?

---

**Fecha:** 2026-04-12  
**Decisión:** **Next.js:** rutas en Axios **sin** prefijo `/api/` duplicado; `NEXT_PUBLIC_API_URL` ya termina en `/api`. Consultas REST en **`/consultas/lista/`** y estudios en **`/consultas/estudios/`** (router Django).  
**Motivo:** Los 404 a `/api/api/pacientes/` y formularios rotos; alinear con `config/urls.py`.  
**Impacto:** Nuevas páginas deben seguir el patrón `api.get('recurso/')` no `api.get('/api/recurso/')`.

---

**Fecha:** 2026-04-12  
**Decisión:** **`PermisoViewSet`** como **solo lectura** (`List`/`Retrieve`); permisos granulares se mantienen por **seed/migraciones**; listado permitido a **ADMIN** y **ADMINISTRATIVO** (`IsAdministrativoOrAdmin`).  
**Motivo:** Catálogo estable tipo Django permissions; la UI de “Permisos” es referencia, la asignación ocurre en **Roles**.  
**Impacto:** No hay POST/PATCH/DELETE en `/api/permisos/` desde la API.

---

**Fecha:** 2026-04-12  
**Decisión:** **`TIME_ZONE = America/La_Paz`** en Django; bitácora enriquecida en **consultas**, **estudios**, **citas** (update/delete), **roles** y **pacientes** (delete), con **IP** y **user_agent** donde faltaba.  
**Motivo:** Auditoría clínica y hora local Bolivia en logs y presentación.  
**Impacto:** Nuevos ViewSets deberían llamar `registrar_bitacora` en mutaciones sensibles.

---

**Fecha:** 2026-03-30  
**Decisión:** Login API solo con **`email`** + **`password`**; verificación con **`Usuario.check_password`**, no `authenticate()`.  
**Motivo:** Comportamiento predecible con CustomUser; el móvil y web envían un único identificador (correo).  
**Impacto:** Contrato `POST /api/auth/login/` cambió respecto al campo `login`; clientes deben usar `email`.

---

**Fecha:** 2026-03-30  
**Decisión:** `AppConfig.apiBaseUrl` en Flutter **siempre con barra final** (`.../api/`); rutas Dio relativas sin `/` inicial (`auth/login/`).  
**Motivo:** Evitar concatenación incorrecta (`/apiauth/login/`).  
**Impacto:** Cualquier `API_BASE_URL` en `.env` se normaliza; refresh token usa la misma base sin doble slash.

---

**Fecha:** 2026-03-30  
**Decisión:** Con **`DEBUG=True`**, `ALLOWED_HOSTS` incluye **`*`** además del CSV de `.env`.  
**Motivo:** Peticiones desde móvil por IP LAN (`192.168.x.x`) sin listar cada IP.  
**Impacto:** Solo desarrollo; con `DEBUG=False` no se añade `*`.

---

**Fecha:** 2026-03-30  
**Decisión:** `SIMPLE_JWT['SIGNING_KEY']` = `SECRET_KEY` si longitud UTF-8 ≥ 32, si no **SHA-256 hex** del secret.  
**Motivo:** Cumplir longitud mínima HMAC para HS256 (PyJWT).  
**Impacto:** Si se activa la derivación, tokens JWT anteriores dejan de ser válidos hasta nuevo login.

---

**Fecha:** 2026-03-31  
**Decisión:** Configuración de **URLs y hosts solo por variables de entorno** (raíz `.env` + `mobile/.env`); sin fallbacks hardcodeados de API en Next/Flutter; `FRONTEND_URL` y `DJANGO_ALLOWED_HOSTS` obligatorios vía `decouple` en Django.  
**Motivo:** Un solo lugar para cambiar IP/dominio al desplegar en VM o nube.  
**Impacto:** Hace falta `.env` completo al arrancar; `backend/conftest.py` suplanta valores mínimos para pytest.

---

**Fecha:** 2026-03-31  
**Decisión:** `ENTRYPOINT` del **backend** en Docker: **`["/bin/sh", "./entrypoint.sh"]`** en lugar de ejecutar `./entrypoint.sh` directo.  
**Motivo:** El volumen `./backend:/app` sobrescribe el árbol del contenedor; en el host el script puede no tener `+x` → `permission denied`.  
**Impacto:** El entrypoint no depende del bit ejecutable en el repo clonado en la VM.

---

**Fecha:** 2026-03-31  
**Decisión:** En **Ubuntu con Docker Engine 28+**, usar plugin **Docker Compose v2** (`docker compose`) en lugar del paquete **`docker-compose`** 1.29.x (Python).  
**Motivo:** Bug conocido `KeyError: 'ContainerConfig'` al recrear contenedores con compose v1 y API moderna.  
**Impacto:** Instalar `docker-compose-v2` en servidor; documentado en `docs/guides/despliegue-ubuntu-nube.md`.

---

**Fecha:** 2026-03-31  
**Decisión:** **No versionar** `.env` ni `mobile/.env` en Git (entradas en `.gitignore`).  
**Motivo:** Evitar filtrar secretos e IPs en el historial público.  
**Impacto:** Cada entorno mantiene copia local desde `*.env.example`.

---

**Fecha:** 2026-03-30  
**Decisión:** `CitaViewSet` filtra queryset por **rol** (paciente → su `Paciente`; médico → su `Especialista`; admin/administrativo → todo).  
**Motivo:** No exponer citas de otros pacientes desde la app móvil.  
**Impacto:** Clientes no PACIENTE deben tener perfil vinculado o verán listas vacías.

---

### Ejemplo / Registro Inicial

**Fecha:** 2026-03-21
**Decisión:** Purga intensiva (Lienzo en Blanco) para Frontend Web, App Mobile y Backend en el Scaffold inicial.
**Motivo:** Evitar arrastrar configuraciones boilerplate basuras o vistas dummy de ejemplo que limiten o confundan el stack real a construir paso a paso. Se optó por un control hiper-granular por el Arquitecto Humano en el ecosistema multiplataforma (Web + Mobile).
**Impacto:** El Backend tiene comentadas sus `LOCAL_APPS`. El Frontend Web es un cascarón Next.js limpio. La app Mobile Flutter fue inicializada pero espera sus directivas de ui/theming. Todo se construirá bajo demanda estricta.

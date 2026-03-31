# DECISIONS LOG

Este archivo documenta todas las decisiones técnicas arquitectónicas importantes tomadas en la evolución del proyecto.

## Formato de Registro
- **Fecha:** YYYY-MM-DD
- **Decisión:** Resumen de la decisión técnica.
- **Motivo:** ¿Por qué se tomó y qué alternativas se consideraron?
- **Impacto:** ¿Qué consecuencias operativas o de código implica?

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

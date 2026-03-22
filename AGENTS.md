# AGENTS.md — Oftalmología Si2

## Meta
- **Proyecto:** Sistema integral clínica oftalmológica multiplataforma
- **Stack:** Django 5 + DRF | Next.js 14 | Flutter + Riverpod | PostgreSQL 16
- **Contenedores:** Docker + Docker Compose
- **Arquitectura:** Clean Architecture + SDD (Spec-Driven Development)

---

## 1. Principios Inquebrantables

### 1.1 CONCEPTOS > CÓDIGO
- Antes de escribir código, definí el dominio. Si no entendés el problema, no toques nada.
- Los modelos de datos son la columna vertebral.
- Preguntá "por qué" antes de "cómo".

### 1.2 SDD es obligatorio
Cambio sustancial = SDD completo:
```
explore → propose → spec → design → tasks → apply → verify → archive
```
Cambios pequeños (bug fix simple) = delegar a sub-agente sin SDD.

### 1.3 Web y Mobile son IGUALES
- Ambas interfaces consumen la **misma API**.
- Ninguna tiene acceso directo a la DB.
- Mobile NO es accesoria — comparte rol principal de visualización.

### 1.4 Seguridad desde la base
- Variables sensibles SOLO vía `.env`.
- Tokens JWT en `flutter_secure_storage` (mobile) — jamás en SharedPreferences.
- Sin hardcodeo de URLs/secretos en código.

### 1.5 Lienzo en Blanco Activo
- Solo programar lo solicitado bajo demanda.
- No sobre-empaquetar sin justificación funcional.

---

## 2. Dominio del Sistema y Lógica de Negocio (En Construcción 🚧)

*Nota: La lógica de negocio no está cerrada. Las reglas, roles y flujos exactos se irán definiendo y documentando en esta sección a medida que el proyecto avance.*

### 2.1 Entidades Base (Esquema preliminar)
```
📋 Paciente
  id, nombre, apellido, cedula, fecha_nacimiento, sexo
  teléfono, email, dirección, antecedentes_medicos, alergias

📅 Cita
  id, paciente, doctor, fecha_hora, tipo_examen, estado, notas

📝 Historia Clínica
  id, paciente, fecha, diagnostico, tratamiento, prescripcion
  examenes_realizados (refraction, fundoscopy, etc.)

👨‍⚕️ Doctor/Usuario
  id, nombre, especialidad, cedula_profesional

🔬 Examen
  id, tipo, resultados, fecha
```

### 2.2 Roles del Sistema (Borrador)
- **Admin:** Control total desde la Web.
- **Doctor:** Gestión de su agenda médica, historias clínicas y carga de exámenes.
- **Recepción:** Gestión de turnos y carga inicial de pacientes en Web.
- **Paciente:** Acceso a la App Mobile para sacar turnos, ver estado y leer sus recetas/exámenes.

### 2.3 Reglas de Negocio Clave (A definir)
- *(Espacio reservado para reglas duras como: "Un paciente no puede cancelar un turno 24hs antes", o "Solo un doctor puede alterar una historia clínica cerrada").*

---

## 3. Arquitectura del Sistema

### 3.1 Estructura del Monorepo
```
Oftalmologia-Si2/
├── backend/           # Django 5 + DRF (API REST) — TODA la lógica de negocio
│   ├── apps/          # Django apps por dominio
│   ├── config/        # Settings modular (base/local/prod)
│   └── requirements/  # Dependencias por entorno
├── frontend/          # Next.js 14 (App Router) — Panel admin/recepción
├── mobile/            # Flutter — App pacientes/médicos
├── docker-compose.yml
└── .env.example
```

### 3.2 Flujo de datos
```
Web:  Browser → Next.js → Django API → PostgreSQL
Mobile: Flutter (Dio) → Django API → PostgreSQL
        (10.0.2.2:8000 en Android Emulator, o IP LAN en físico)
```

### 3.3 Regla de oro
> Web y Mobile son meros visualizadores e interactuadores. **TODA la lógica de negocio vive aislada en el Backend.**

---

## 4. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Django 5 + DRF + `simplejwt` |
| DB | PostgreSQL 16 |
| Web | Next.js 14 (App Router) |
| Mobile | Flutter + Dio + `flutter_secure_storage` |
| State Mobile | Riverpod/Provider/BLoC (a definir) |
| Infra | Docker + Docker Compose |

---

## 4.5 Cómo Inicializar el Proyecto (Arranque)

El ecosistema corre hibridizado (Backend/DB en Docker, Frontends en local por ahora).

### 1. Levantar Infraestructura y Backend (Docker)
En la raíz del proyecto:
```bash
# Copiar y configurar variables de entorno (solo la primera vez)
cp .env.example .env

# Construir y levantar los contenedores
docker-compose up --build

# Aplicar migraciones (solo la primera vez o cuando haya cambios)
docker-compose exec backend python manage.py migrate

# Crear superusuario (solo la primera vez)
docker-compose exec backend python manage.py createsuperuser
```
*(Levanta PostgreSQL en el puerto 5432 y Django en el 8000).*

### 2. Comandos Esenciales Backend (Django)
```bash
# Crear nuevas migraciones
docker-compose exec backend python manage.py makemigrations

# Correr tests
docker-compose exec backend python manage.py test

# Abrir shell de Django
docker-compose exec backend python manage.py shell
```

### 3. Levantar Frontend Web (Next.js)
En una nueva terminal, desde la raíz:
```bash
cd frontend
npm install  # (solo la primera vez)
npm run dev
```
*(Levanta en el puerto 3000 y apunta a localhost:8000).*

### 4. Levantar Mobile (Flutter)
Tener un emulador Android/iOS corriendo o dispositivo físico conectado.
En una nueva terminal, desde la raíz:
```bash
cd mobile
flutter pub get  # (solo la primera vez)
flutter run
```
*(Nota: El emulador Android apunta a la API usando `http://10.0.2.2:8000`)*

---

## 5. Convenciones de Código

### 5.1 Naming y Ramas (Git)
| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Ramas (Git) | `tipo/nombre-feature` | `feat/auth-backend`, `fix/login-ui` |
| Modelos Django | PascalCase singular | `Patient`, `Appointment` |
| Serializers | `{Model}Serializer` | `PatientSerializer` |
| Views/ViewSets | `{Model}ViewSet` | `PatientViewSet` |
| URLs API | snake_case plural | `/api/v1/patients/` |
| Rutas Flutter | kebab-case | `/patient-detail` |
| Componentes React | PascalCase | `PatientList.tsx` |
| Feature folders | kebab-case | `patient-management/` |

### 5.2 Django Backend
```
apps/
└── {feature}/
    ├── models.py        # UUID como PK, created_at, updated_at
    ├── serializers.py
    ├── views.py         # ViewSets
    ├── urls.py
    ├── admin.py
    └── tests/
```
**Reglas:** Soft deletes con `is_active`, validar con serializers.

### 5.3 Flutter Mobile (Clean Architecture)
```
lib/
├── core/              # Networking genérico, utilities, themes, tokens
├── features/
│   ├── auth/
│   ├── appointments/   # Vistas calendario, DTOs citas
│   └── records/       # Historias clínicas móviles
├── config/
│   ├── routes.dart     # GoRouter
│   └── theme.dart      # Colores centralizados
└── app_router.dart
```
**Reglas:** Riverpod, GoRouter, Repository pattern, Equatable, Freezed.

### 5.4 Next.js Frontend
```
src/
├── app/               # App Router
├── components/        # ui/ (primitivos), layout/
├── features/           # Por dominio
├── lib/                # api.ts (Axios), utils.ts
└── types/
```
**Reglas:** Server Components primero, SWR/React Query, Zod.

### 5.5 Convenciones de Testing (Obligatorias)
El ecosistema exige pruebas para asegurar la estabilidad de la lógica médica y las integraciones:
- **Backend (Django):**
  - Usar `pytest` y `pytest-django`.
  - Crear fixtures con `factory_boy`.
  - Testear siempre los serializers, permisos de endpoints y modelos clave.
- **Frontend Web (Next.js):**
  - Usar `Vitest` + `React Testing Library`.
  - Testear flujos de UI y validaciones de formularios con Zod.
- **Mobile (Flutter):**
  - Usar `flutter_test`.
  - Priorizar *Unit tests* para Providers/BLoCs y *Widget tests* para componentes reutilizables críticos (ej. formularios de login o vistas de calendario de turnos).
- **Regla General:** El código que implemente una Regla de Negocio Crítica DEBE estar acompañado de su test correspondiente antes de cerrarse.

---

## 6. SDD — Spec-Driven Development

### 6.1 Fases
| Fase | Alias | Lee | Escribe |
|------|-------|-----|---------|
| Explore | sdd-explore | — | explore |
| Propose | sdd-propose | explore* | proposal |
| Spec | sdd-spec | proposal | spec |
| Design | sdd-design | proposal | design |
| Tasks | sdd-tasks | spec + design | tasks |
| Apply | sdd-apply | tasks + spec + design | apply-progress |
| Verify | sdd-verify | spec + tasks | verify-report |
| Archive | sdd-archive | all | archive-report |

### 6.2 Artifact Store
- **Modo activo:** `engram` (memoria persistente)
- **Fallback:** `openspec` (archivos en `.agent/`)

### 6.3 Tema Keys de engram
```
sdd-init/{project}
sdd/{change-name}/explore | proposal | spec | design | tasks | apply-progress | verify-report | archive-report | state
```

---

## 7. Reglas de Orchestration

### 7.1 Delegación obligatoria
| Tipo de tarea | Acción |
|---------------|--------|
| Leer/escribir código | **Delegar** |
| Análisis de código | **Delegar** |
| Tests | **Delegar** |
| Pregunta simple | Responder o delegar |
| Cambio sustancial | SDD |
| Decisión arquitectónica | SDD |

### 7.2 Anti-patrones (NUNCA)
- ❌ Leer archivos fuente para "entender" → delegá
- ❌ Escribir/editar código inline → delegá
- ❌ Escribir specs inline → delegá
- ❌ "Es un cambio pequeño" → delegá igual

### 7.3 Auto-detección de skills
| Contexto | Skill |
|----------|-------|
| SDD cualquier fase | `sdd-{phase}` |
| Flutter/Dart | `flutter-best-practices` |
| React/Next.js | `react-architecture` |
| Crear skill | `skill-creator` |

---

## 8. Workflow de Sesión

### 8.1 Inicio de sesión
1. `mem_context` → recuperar contexto previo
2. `mem_search` → buscar decisiones, bugs, patterns
3. `mem_search("sdd/{change}/state")` → si hay SDD activo

### 8.2 Durante la sesión
- Decisiones importantes → `mem_save`
- Progreso SDD → `mem_update` en topic_key

### 8.3 Fin de sesión (OBLIGATORIO)
```markdown
## Goal
## Instructions
## Discoveries
## Accomplished
## Next Steps
## Relevant Files
```

---

## 9. Memoria IA — docs/ai/

**Orden de lectura obligatoria:**
1. `MASTER_AGENT_PROMPT.md` — Reglas primarias
2. `PROJECT_VISION.md` — Qué y por qué del sistema
3. `ARCHITECTURE.md` + `MOBILE_ARCHITECTURE.md` — Cómo se interconecta todo
4. `TECH_STACK.md` — Arsenal tecnológico
5. `CURRENT_STATE.md` + `HANDOFF_LATEST.md` — Estado actual
6. `NEXT_STEPS.md` — Qué sigue

**Nunca cerrés sin actualizar `docs/ai/`** (CURRENT_STATE, HANDOFF_LATEST, NEXT_STEPS, DECISIONS_LOG si aplica).

---

## 10. Estado Actual

**Etapa:** Scaffolding limpio
- ✅ Docker + PostgreSQL conectados
- ✅ Backend Django listo (lienzo en blanco)
- ✅ Next.js limpio
- ✅ Flutter con librerías base (Dio, Router, SecureStorage)

**Pendientes inmediatos:**
1. Auth Backend (CustomUser + JWT)
2. Scaffold/Themes Flutter
3. Login Web mínimo

## 11. Integración de Diseño (Figma MCP)

Para mantener fidelidad visual con el diseño preestablecido, el entorno soporta la inyección de **Figma mediante MCP (Model Context Protocol)**.

### Reglas para el Agente (IA):
- Si el usuario pide maquetar una UI o configurar el `theme.dart` (Flutter) / `tailwind.config.ts` (Next.js), el agente DEBE intentar consultar el servidor MCP de Figma primero para extraer colores exactos, tipografías y espaciados.
- NO inventar paletas de colores si el MCP de Figma está disponible.

### Cómo configurarlo en VS Code:
1. Conseguir el `Personal Access Token` de Figma y el `File ID` del proyecto de Oftalmología-Si2.
2. Agregarlos a la configuración MCP de la extensión de IA (ej. Cline, Roo Code, Copilot) usando `@smithery/figma-mcp-server` u oficial:
```json
"figma": {
  "command": "npx",
  "args": ["-y", "@smithery/figma-mcp-server"],
  "env": {
    "FIGMA_ACCESS_TOKEN": "figd_tu_token",
    "FIGMA_FILE_ID": "el_id_de_tu_archivo"
  }
}
```
*(Variables documentadas en el `.env.example`).*

---

## 12. Referencias

- Skills: `~/.config/opencode/skills/`
- Shared conventions: `.agent/skills/_shared/`
- Artifact store: engram o `.agent/openspec/`

# ARCHITECTURE

## Arquitectura del Proyecto
Sistema distribuido basado en arquitectura modular. El ecosistema es un Monorepo estructurado en tres vértices (Backend, Frontend Web, Mobile) sustentados por Infraestructura (Docker, DB). Funciona localmente, y está preparado para despliegue en Nube/VM.

## Principios Arquitectónicos
- **Modularidad Total:** Separación por responsabilidades tanto en carpetas como en apps internas de Django. 
- **API Universal:** El Backend expone endpoints uniformes utilizados tanto por el canal Web como por el Mobile de manera equivalente y concurrente.
- **Seguridad y UX Base:** Desde la capa más baja se deben establecer validaciones fuertes, sanitización de datos (Backend) y feedback visual, validaciones cliente y prevención de errores (Frontend/Mobile).
- **DRY (Don't Repeat Yourself) & SOLID.** 

## Reglas que No Deben Romperse
1. Web (`/frontend`) y Mobile (`/mobile`) son meros visualizadores e interactuadores; TODA la lógica de negocio vive aislada en el Backend.
2. Cada aplicación/módulo soluciona un solo dominio (Auth, Pacientes, Turnos).
3. Todas las variables sensibles habitan vía variables de entorno (`.env`), preparadas para escalar a secretos de nube (ej. AWS Secrets). Jamás en commits de código.

## Organización Modular y Responsabilidades
- `/backend`: API REST (Django + DRF). Responsable de validación, DB, seguridad JWT y lógica de negocio.
- `/frontend`: Panel Web de Gestión (Next.js). Operadores administrativos.
- `/mobile`: App multiplataforma (Flutter). Interfaz portable pacientes/médicos.
- `/infra` o raíz: Docker, Docker Compose, pipelines de automatización para nube/VM y entorno local.

## Flujo General del Sistema Diferenciado
- **Web Flow:** Browser -> Next.js Render/Fetch -> API Django -> PostgreSQL -> API Django -> UI State.
- **Mobile Flow:** Dispositivo (iOS/Android) -> Flutter Dio HTTP -> API Django -> PostgreSQL -> API Django -> BloC/Provider State -> UI Render.

## Diseño de la API REST (Decisión de Enrutamiento Anidado)
Para maximizar la **seguridad de datos clínicos (HIPAA/Data Leak Prevention)** y la consistencia del estado en el cliente, todas las entidades que le pertenezcan a un perfil maestro deben usar **URLs Anidadas** en lugar de planas.

Ejemplo implementado: Para acceder o crear recetas, diagnósticos o evoluciones, la API requiere la ruta:
`POST /api/historial-clinico/{id}/recetas/`

**Justificación para Agentes/Desarrolladores Futuros:**
1. **Prevención de Fuga de Datos (Escenario GET):** Una URL plana (`GET /api/diagnosticos/`) permitiría que un error u omisión de parámetros en el frontend devuelva datos de todos los pacientes de la base de datos de golpe. La URL anidada fuerza un error 404 si el sistema escanea sin el ID del paciente, bloqueando la filtración.
2. **Prevención de Corrupción de Estado (Escenario POST):** Si un Frontend en React/Flutter sufre un bug y confunde los IDs guardados en caché al cambiar de pestaña entre dos pacientes, una URL libre (`POST /api/recetas/` mandando `"id_historial": X` en el body JSON) guardaría el diagnóstico en el paciente equivocado, incurriendo en negligencia médica grave. Las rutas anidadas inyectan de forma inmutable a quién le pertenece la relación directamente desde la URL principal (`/historial-clinico/{ID_CORRECTO}/`). El backend prioriza el ID de la URL y sobreescribe cualquier ID corrupto enviado en el JSON, y los Middlewares interceptan la solicitud antes de siquiera tocar la vista para corroborar acceso.

**REGLA:** Nunca abstraer o aplanar los submódulos clínicos. Mantener la dependencia en la URL.

# MASTER AGENT PROMPT

**⚠️ REGLAS PRIMARIAS PARA CUALQUIER IA O AGENTE QUE PROGRAME ESTE CÓDIGO:**

---

1. **CONTEXTO OMNIPRESENTE (LEE `docs/ai/`):** El sistema es MULTIPLATAFORMA y **SaaS multi-tenant**. Incluye backend Django, frontend Next.js y app Flutter. Antes de ejecutar o predecir código, leer **`ARCHITECTURE.md`**, **`PLATFORM_SAAS.md`** (login clínica vs plataforma, JWT, rutas `/api/public/...`), y **`MOBILE_ARCHITECTURE.md`** cuando el trabajo toque mobile. NUNCA ignorar multi-tenant ni mezclar contextos superadmin vs operador de clínica.
2. **COEXISTENCIA Y EQUIDAD WEB/MOBILE:** Cualquier endpoint o funcionalidad que edites o sumes en el backend DRF probablemente va a ser consumido tanto por la app web administrativa como por la app móvil física. Explica siempre tus flujos pensando integralmente: "Web Frontend -> Backend -> Flutter Mobile -> Postgres DB". ¡Cuidado con la serialización JSON universal!
3. **NO HARDCODEES Y PIENSA EN INFRAESTRUCTURA ABIERTA:** Todo secreto, token y URL se pasa vía `.env`. Proyecta siempre tus adiciones pensando en un empaquetado `Local + Docker + Nube/VM`. Lo que corre, debe poder ser deployado sin trabas ni modificaciones sustanciales de las rutas hardcodeadas.
4. **LA SEGURIDAD Y UI/UX INICIARON DESDE LA BASE:** Implementa control de errores limpios en todos lados (Spinners, SnackBar exceptions en Flutter, Toasts en React, respuestas de error HTTP semánticas `4xx, 5xx` en Python). Protege los tokens con `flutter_secure_storage` y headers de red limpios.
5. **EL MANDAMIENTO DE MEMORIA (ACTUALIZA DOCS/AI/):** Antes de entregar la solución al usuario y abandonar el chat, **tienes el deber incuestionable de:**
   - Escribir lo logrado a `CURRENT_STATE.md`.
   - Llenar el `HANDOFF_LATEST.md` para el agente (o tú mismo) del mañana.
   - Reflejar si se completaron o añadieron `NEXT_STEPS.md`.
   - Modificar lógicas arquitecturales en `DECISIONS_LOG.md` (si aplica).

# DESING

Registro vivo de diseño UI/UX para Oftalmología Si2.

> Nota: nombre `DESING.md` se mantiene así por decisión de equipo en esta sesión.

## 1) Objetivo

Guardar decisiones de diseño del proyecto actual para continuidad entre sesiones/agentes, con foco en mobile paciente.

## 2) Alcance actual

- Plataforma principal en esta fase: **Mobile (Flutter)**.
- Usuario objetivo: **Paciente**.
- Tipo de trabajo: mejoras de **UI/UX**, **animaciones** y consistencia visual.

## 3) Principios de diseño activos

1. Claridad visual clínica (jerarquía simple, legibilidad alta).
2. Feedback inmediato (loading/error/empty/success visibles).
3. Reutilización (componentes UI compartidos antes que duplicación).
4. Animación sutil y funcional (sin distracción).
5. Accesibilidad base (targets táctiles, contraste, tipografía cómoda).

## 4) Inventario de pantallas actuales (mobile)

| Pantalla | Estado | Objetivo UX | Prioridad |
|---|---|---|---|
| Login | Implementada | Acceso claro y confiable | Media |
| Home paciente | Implementada | Ver próxima/última cita + accesos rápidos | Alta |
| Citas (tab) | Implementada | Listado próximo/historial legible | Alta |
| Historial clínico (consultas/estudios) | Implementada | Lectura de información clínica | Alta |
| Perfil | Básica | Gestión de cuenta y salida segura | Media |

## 5) Backlog de mejoras UI/UX (sprint actual)

| ID | Mejora | Tipo | Pantalla | Estado |
|---|---|---|---|---|
| UX-01 | Unificar spacing, radio, tipografía y colores en tokens | Sistema visual | Global | Completo (Batch A+B+C tokenizados) |
| UX-02 | Estandarizar estados loading/empty/error/retry | Feedback | Home/Citas/Historial | Completo (iteracion 1 + 2) |
| UX-03 | Añadir skeleton loaders en listados | Micro-UX | Citas/Historial | Completo (AppSkeletonTile + AppShimmerCard) |
| UX-04 | Microanimaciones de entrada/salida (fade+slide) | Animación | Home/Citas | Completo (AppFadeSlideIn + AnimatedSwitcher) |
| UX-05 | Mejorar accesibilidad táctil/contraste | Accesibilidad | Global | Completo (semantics, touch targets 44x44, labels) |

## 6) Reglas de animación

- Duración corta (150ms–280ms) para transiciones comunes.
- Curvas suaves (`easeOut`, `easeInOut`).
- No animar todo al mismo tiempo.
- Priorizar animaciones de estado y navegación, no decorativas.

## 7) Convención de evidencia por iteración

Cada iteración de diseño debe guardar:

1. Capturas antes/después (si aplica).
2. Lista de componentes nuevos/reutilizados.
3. Estados UX cubiertos (`loading/empty/error/success`).
4. Riesgos detectados y decisiones tomadas.

## 8) Próxima iteración sugerida

1. Home paciente: tokens + estados + animación sutil.
2. Citas tab: skeleton + empty/error homogéneo.
3. Historial clínico: mejorar jerarquía visual y legibilidad de cards.

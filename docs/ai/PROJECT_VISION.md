# PROJECT VISION

## Nombre del Proyecto
Oftalmología Si2

## Problema que Resuelve
Gestión fragmentada e ineficiente de las operaciones de una clínica oftalmológica, desde el registro de pacientes y la asignación de citas, hasta el manejo de historiales médicos especializados, la falta de una plataforma integrada para el historial y contacto médico, incluyendo a los propios pacientes desde sus dispositivos personales.

## Objetivo Principal
Proveer un sistema integral híbrido (Web + Mobile), moderno y escalable que centralice la gestión clínica, administrativa y operativa. Debe contemplar seguridad y una excelente UI/UX desde la base, proveyendo al personal médico una vista web compleja y a pacientes/médicos una experiencia fluida e intuitiva en la app móvil.

## Alcance General
- **Backend Central:** API RESTful robusta y segura (Django).
- **Frontend Web:** Interfaz para administradores, médicos y personal de recepción (Next.js).
- **Mobile:** Aplicación móvil interactiva para pacientes (agendamiento, historial) y médicos (agenda, notas) nativamente multiplataforma (Flutter).
- **SaaS multi-tenant:** Clínicas aisladas por **schema PostgreSQL** (`django-tenants`); planes FREE/PLUS/PRO; **dos portales web**: operación por clínica (`/login` + `/t/<slug>/…`) y **administración de la plataforma** (`/platform/login`) para gestionar organizaciones sin mezclar datos clínicos entre schemas (ver `docs/ai/PLATFORM_SAAS.md`).

## Visión del Sistema
Una plataforma segura, modular y altamente mantenible preparada para Local + Docker + Nube/VM. Construida como un monorepo que separa estrictamente las responsabilidades del backend (reglas de negocio y datos), de los frontends web y mobile (presentación en sus respectivos paradigmas).

## Principios Inmutables (Qué no perder)
- **Coexistencia Web y Mobile:** Ambas interfaces consumen la misma API central. Ninguna tiene acceso directo a la DB.
- **Seguridad y UI/UX primero:** Cuidado riguroso del almacenamiento de tokens (Secure Storage / HTTP-only) y flujos limpios con prevención de datos harcodeados.
- **"Lienzo en Blanco" Activo:** Solo programar lo solicitado bajo demanda. No sobre-empaquetar sin justificación funcional.

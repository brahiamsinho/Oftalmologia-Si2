# NEXT STEPS

Lista priorizada de los siguientes pasos a realizar en el proyecto Oftalmología Si2.

## Corto Plazo
- [ ] Backend: Crear "CustomUser" para alojar roles (Admin, Doc, Patient) y token JWT auth.
- [ ] Mobile: Extender scaffolding/bases de proyecto Flutter (Theming principal, UX base, ruteo) alineados al Canvas en blanco. Establecer configuraciones seguras y limpias para red (Dio HTTP).
- [ ] Frontend: Preparar UI de autenticación Web (Login form mínimo, Auth Provider genérico).

## Mediano Plazo
- [ ] Core Domains: Implementar modelos Django para Pacientes y citas oftalmológicas básicas. Exponer ModelViewSets vía DRF.
- [ ] Web Admin: Consumir endpoints de Pacientes y mostrarlos en tablas responsivas Next.js.
- [ ] Mobile App: Pantalla Listado de Próximas Citas y Home de Médico / Paciente integrados con la API Real.

## Largo Plazo
- [ ] Flujo completo Web: Historias clínicas detalladas, imágenes, estudios.
- [ ] Flujo App: Notificaciones (FCM o similar) de recordatorio de turnos.
- [ ] Despliegue en Servidores Nube (VM/VPS con Nginx invertido y volúmenes Docker remotos).

## Pendientes Técnicos Singulares
- Aclarar convenciones de código entre TypeScript, Dart y Python en un único doc estilo.
- Manejo integral de Storage de imágenes oftalmológicas (Almacenamiento local o AWS S3/Cloud Storage) conviviendo entre Web y App Móvil subiendo fotos/archivos.

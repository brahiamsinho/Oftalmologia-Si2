# Credenciales Demo (Seeders)

Estas credenciales son de **desarrollo/demo** y se crean desde seeders.

## 1) Platform Admin (schema `public`)

- Email: `platform@oftalmologia.local`
- Password: `platform123`
- Seeder: `backend/seeders/seed_platform_admin.py`
- Comando: `python manage.py seed --schema public --only platform_admin`

## 2) Flota SaaS demo (5 clínicas)

Seeder: `backend/seeders/seed_saas_demo_fleet.py`

Se ejecuta automáticamente al arrancar Docker si `RUN_SEEDERS=1` y `RUN_SAAS_DEMO_FLEET=1` (default).

Comando manual:

```bash
docker compose exec backend python manage.py seed --schema public --only saas_demo_fleet
```

| Clínica | Slug | Plan | Login | Email | Password |
|---------|------|------|-------|-------|----------|
| Clínica Norte Visión | `clinica-norte` | FREE | `/t/clinica-norte/login` | `admin.norte@oftalmologia.local` | `AdminNorte123!` |
| Centro Oftalmológico Sur | `clinica-sur` | FREE | `/t/clinica-sur/login` | `admin.sur@oftalmologia.local` | `AdminSur123!` |
| Clínica Andina de Ojos | `clinica-andina` | PLUS | `/t/clinica-andina/login` | `admin.andina@oftalmologia.local` | `AdminAndina123!` |
| Instituto Ocular Pacífico | `clinica-pacifico` | PLUS | `/t/clinica-pacifico/login` | `admin.pacifico@oftalmologia.local` | `AdminPacifico123!` |
| Prime Eye Center | `clinica-prime` | PRO | `/t/clinica-prime/login` | `admin.prime@oftalmologia.local` | `AdminPrime123!` |

Cada clínica incluye: permisos, roles, tipos de cita, seguros, descuentos, facturación y datos de reportes (6 meses).

Los pacientes de reportes usan **prefijo por clínica** (`CNRT-`, `CSUR-`, etc.) y nombres distintos por tenant (`seeders/demo_data_variety.py`). Tras actualizar seeders:

```bash
docker compose exec backend python manage.py seed --schema public --only saas_demo_fleet
docker compose exec backend python manage.py seed --tenant clinica-demo --only reporting_6months
```

## 3) Tenant demo base (`clinica-demo`)

Seeders ejecutados en tenant demo por `entrypoint.sh`:
- `seeders.seed_admin`
- `seeders.seed_demo_paciente`

Credenciales:

- Admin tenant demo
  - Username: `admin`
  - Email: `admin@oftalmologia.local`
  - Password: `admin123`
- Paciente demo
  - Username: `brandon`
  - Email: `brandon@gmail.com`
  - Password: `Felipe321`

## 4) Usuarios médicos demo (`clinica-demo`)

Seeder: `backend/seeders/seed_demo_paciente.py`

- `carlos.ramirez@oftalmologia.local` / `Medico123!`
- `ana.chen@oftalmologia.local` / `Medico123!`
- `javier.montano@oftalmologia.local` / `Medico123!`

## 5) Nota de seguridad

- No usar estas credenciales en producción.
- Para producción, crear usuarios con contraseñas únicas y rotación periódica.

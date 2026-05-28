# Credenciales Demo (Seeders)

Estas credenciales son de **desarrollo/demo** y se crean desde seeders.

## 1) Platform Admin (schema `public`)

- Email: `platform@oftalmologia.local`
- Password: `platform123`
- Seeder: `backend/seeders/seed_platform_admin.py`
- Comando: `python manage.py seed --schema public --only platform_admin`

## 2) Flota SaaS demo (5 clínicas)

Seeder: `backend/seeders/seed_saas_demo_fleet.py`

- Clínica Norte Visión (`clinica-norte`, FREE)
  - Email: `admin.norte@oftalmologia.local`
  - Password: `AdminNorte123!`
- Centro Oftalmológico Sur (`clinica-sur`, FREE)
  - Email: `admin.sur@oftalmologia.local`
  - Password: `AdminSur123!`
- Clínica Andina de Ojos (`clinica-andina`, PLUS)
  - Email: `admin.andina@oftalmologia.local`
  - Password: `AdminAndina123!`
- Instituto Ocular Pacífico (`clinica-pacifico`, PLUS)
  - Email: `admin.pacifico@oftalmologia.local`
  - Password: `AdminPacifico123!`
- Prime Eye Center (`clinica-prime`, PRO)
  - Email: `admin.prime@oftalmologia.local`
  - Password: `AdminPrime123!`

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

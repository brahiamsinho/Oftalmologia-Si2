# Sesión 2026-05-28 - flota SaaS demo (5 clínicas)

## Objetivo
Crear un escenario demo más cercano a operación real SaaS:
- 5 clínicas (2 FREE, 2 PLUS, 1 PRO)
- admin por clínica
- datos históricos de 6 meses por tenant

## Cambios

### Nuevo seeder

- `backend/seeders/seed_saas_demo_fleet.py`

Responsabilidades:
- ejecutar solo en `schema public`,
- crear/actualizar tenant + domain + settings + subscription + usage,
- asegurar schema por tenant,
- crear/actualizar admin de clínica,
- ejecutar `seed_tipos_cita` y `seed_reporting_6months` dentro de cada schema tenant.

### Registro en comando seed

- `backend/apps/core/management/commands/seed.py`
  - nueva key: `saas_demo_fleet`

## Ejecución validada

```bash
docker compose exec backend python manage.py seed --schema public --only saas_demo_fleet
```

Resultado:
- `990 creados, 0 existentes` (primera corrida).

## Clínicas y credenciales

- `clinica-norte` (FREE): `admin.norte@oftalmologia.local / AdminNorte123!`
- `clinica-sur` (FREE): `admin.sur@oftalmologia.local / AdminSur123!`
- `clinica-andina` (PLUS): `admin.andina@oftalmologia.local / AdminAndina123!`
- `clinica-pacifico` (PLUS): `admin.pacifico@oftalmologia.local / AdminPacifico123!`
- `clinica-prime` (PRO): `admin.prime@oftalmologia.local / AdminPrime123!`

## Nota
El comando imprime la lista de credenciales al finalizar para facilitar validación manual de login y pruebas cross-tenant.

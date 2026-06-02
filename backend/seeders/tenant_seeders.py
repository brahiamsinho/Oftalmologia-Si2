"""
Lista canónica de seeders por tenant (schema de clínica).

Usada por entrypoint.sh (clínica demo) y seed_saas_demo_fleet (flota SaaS).
No incluye seed_admin: cada tenant define su propio administrador.
"""

TENANT_SEEDER_MODULES = [
    'seeders.seed_permisos',
    'seeders.seed_roles',
    'seeders.seed_tipos_cita',
    'seeders.seed_recordatorios',
    'seeders.seed_seguros',
    'seeders.seed_descuentos',
    'seeders.seed_facturacion',
    'seeders.seed_reporting_6months',
]

DEMO_TENANT_SEEDER_MODULES = [
    'seeders.seed_admin',
    *TENANT_SEEDER_MODULES,
    'seeders.seed_demo_paciente',
]


def run_tenant_seeders(modules=None):
    """
    Ejecuta seeders en el schema tenant actual.

    Returns:
        (creados, existentes)
    """
    import importlib

    total_created = 0
    total_existing = 0

    for module_path in modules or TENANT_SEEDER_MODULES:
        module = importlib.import_module(module_path)
        created, existing = module.run()
        total_created += created
        total_existing += existing

    return total_created, total_existing

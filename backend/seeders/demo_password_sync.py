"""
Utilidades compartidas para credenciales demo en seeders.

En desarrollo, al reiniciar contenedores la BD suele persistir (volumen postgres_data)
pero las contraseñas en código pueden cambiar. SYNC_DEMO_PASSWORDS=1 (default) fuerza
set_password() en usuarios demo ya existentes.
"""
import os


def should_sync_demo_passwords() -> bool:
    raw = os.environ.get('SYNC_DEMO_PASSWORDS', '1').strip().lower()
    return raw in ('1', 'true', 'yes', 'on')


def seeder_result(created: int = 0, existing: int = 0, synced: int = 0):
    """Tupla estándar para run() de seeders: (creados, existentes, passwords_synced)."""
    return created, existing, synced

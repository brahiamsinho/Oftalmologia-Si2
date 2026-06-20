"""
seeders/seed_admin.py

Crea el superusuario administrador del sistema dentro del schema actual.
"""
from django.contrib.auth import get_user_model

from seeders.demo_password_sync import should_sync_demo_passwords


ADMIN_DATA = {
    'username': 'admin',
    'email': 'admin@oftalmologia.local',
    'password': 'admin123',
    'nombres': 'Administrador',
    'apellidos': 'Sistema',
    'tipo_usuario': 'ADMIN',
}


def run():
    """
    Crea el superusuario si no existe en el schema actual.
    Retorna (creados, existentes, passwords_synced).
    """
    User = get_user_model()

    user = User.objects.filter(username=ADMIN_DATA['username']).first()
    if user is not None:
        if should_sync_demo_passwords():
            user.set_password(ADMIN_DATA['password'])
            user.email = ADMIN_DATA['email']
            user.nombres = ADMIN_DATA['nombres']
            user.apellidos = ADMIN_DATA['apellidos']
            user.tipo_usuario = ADMIN_DATA['tipo_usuario']
            user.is_active = True
            user.is_superuser = True
            user.is_staff = True
            user.save()
            return 0, 0, 1
        return 0, 1, 0

    User.objects.create_superuser(
        username=ADMIN_DATA['username'],
        email=ADMIN_DATA['email'],
        password=ADMIN_DATA['password'],
        nombres=ADMIN_DATA['nombres'],
        apellidos=ADMIN_DATA['apellidos'],
        tipo_usuario=ADMIN_DATA['tipo_usuario'],
    )

    return 1, 0, 0
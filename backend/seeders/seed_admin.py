"""
seeders/seed_admin.py
Crea el superusuario administrador del sistema si no existe.
Proyecto académico — credenciales fijas de desarrollo.
"""
from django.contrib.auth import get_user_model


ADMIN_DATA = {
    'username':     'admin',
    'email':        'admin@oftalmologia.local',
    'password':     'admin123',
    'nombres':      'Administrador',
    'apellidos':    'Sistema',
    'tipo_usuario': 'ADMIN',
}


def run():
    """
    Crea el superusuario si no existe.
    Retorna (creados, existentes).
    """
    User = get_user_model()

    if User.objects.filter(username=ADMIN_DATA['username']).exists():
        return 0, 1

    User.objects.create_superuser(
        username=ADMIN_DATA['username'],
        email=ADMIN_DATA['email'],
        password=ADMIN_DATA['password'],
        nombres=ADMIN_DATA['nombres'],
        apellidos=ADMIN_DATA['apellidos'],
        tipo_usuario=ADMIN_DATA['tipo_usuario'],
    )
    return 1, 0

"""
apps/users/managers.py
Manager personalizado para el CustomUser del sistema.
"""
from django.contrib.auth.models import BaseUserManager


class UsuarioManager(BaseUserManager):

    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es obligatorio.')
        if not username:
            raise ValueError('El username es obligatorio.')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('tipo_usuario', 'ADMIN')
        extra_fields.setdefault('estado', 'ACTIVO')
        extra_fields.setdefault('nombres', 'Super')
        extra_fields.setdefault('apellidos', 'Admin')

        if not extra_fields.get('is_staff'):
            raise ValueError('Superusuario debe tener is_staff=True.')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superusuario debe tener is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)

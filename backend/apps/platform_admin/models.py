from django.contrib.auth.hashers import check_password, make_password
from django.db import models


class PlatformAdministrator(models.Model):
    """
    Operador de la plataforma (schema public). No es un Usuario de clínica.

    Autenticación: JWT con claim token_scope=platform (ver apps.core.authentication).
    """

    email = models.EmailField(max_length=254, unique=True, db_index=True)
    password = models.CharField(max_length=128)
    nombre = models.CharField(max_length=150, blank=True, default='')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_administrator'
        verbose_name = 'Administrador de plataforma'
        verbose_name_plural = 'Administradores de plataforma'

    def __str__(self):
        return self.email

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UsuarioManager


class TipoUsuario(models.TextChoices):
    ADMINISTRATIVO = 'ADMINISTRATIVO', 'Administrativo'
    MEDICO = 'MEDICO', 'Médico'
    ESPECIALISTA = 'ESPECIALISTA', 'Especialista'
    PACIENTE = 'PACIENTE', 'Paciente'
    ADMIN = 'ADMIN', 'Admin del Sistema'


class EstadoUsuario(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    INACTIVO = 'INACTIVO', 'Inactivo'
    BLOQUEADO = 'BLOQUEADO', 'Bloqueado'


class Usuario(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=120, unique=True)

    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    foto_perfil = models.ImageField(upload_to='perfiles/', blank=True, null=True)

    tipo_usuario = models.CharField(max_length=20, choices=TipoUsuario.choices)

    estado = models.CharField(
        max_length=20,
        choices=EstadoUsuario.choices,
        default=EstadoUsuario.ACTIVO,
    )

    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'nombres', 'apellidos', 'tipo_usuario']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f'{self.nombres} {self.apellidos} ({self.username})'

    def get_full_name(self):
        return f'{self.nombres} {self.apellidos}'

    def get_short_name(self):
        return self.nombres


class TokenRecuperacion(models.Model):
    id_token = models.BigAutoField(primary_key=True)

    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='tokens_recuperacion',
    )

    token = models.TextField(unique=True)
    expira_en = models.DateTimeField()
    usado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tokens_recuperacion'
        verbose_name = 'Token de Recuperación'
        verbose_name_plural = 'Tokens de Recuperación'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'Token {self.id_token} — {self.id_usuario} [usado={self.usado}]'
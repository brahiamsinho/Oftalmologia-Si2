from django.conf import settings
from django.db import models


class Especialista(models.Model):
    id_especialista = models.BigAutoField(primary_key=True)

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='id_usuario',
        related_name='especialista',
    )

    codigo_profesional = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
    )

    especialidad = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'especialistas'
        verbose_name = 'Especialista'
        verbose_name_plural = 'Especialistas'
        ordering = ['usuario__apellidos', 'usuario__nombres']

    def __str__(self):
        return f'{self.usuario.get_full_name()} — {self.especialidad}'

    def get_full_name(self):
        return self.usuario.get_full_name()
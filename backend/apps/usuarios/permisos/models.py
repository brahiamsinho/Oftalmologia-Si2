from django.db import models


class Permiso(models.Model):
    """
    Permiso granular por módulo funcional.

    Ejemplos:
      codigo='pacientes.crear', modulo='pacientes'
      codigo='citas.reprogramar', modulo='citas'
      codigo='usuarios.asignar_roles', modulo='usuarios'
    """

    id_permiso = models.BigAutoField(primary_key=True)

    codigo = models.SlugField(
        max_length=120,
        unique=True,
        help_text='Código único del permiso. Ej: pacientes.crear',
    )

    nombre = models.CharField(max_length=120)

    modulo = models.CharField(
        max_length=80,
        help_text='Módulo funcional. Ej: pacientes, citas, usuarios',
    )

    descripcion = models.CharField(
        max_length=255,
        blank=True,
        default='',
    )

    activo = models.BooleanField(default=True)

    es_sistema = models.BooleanField(
        default=True,
        help_text='Indica si el permiso pertenece al catálogo base del sistema.',
    )

    class Meta:
        db_table = 'permisos'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['modulo', 'codigo']

    def __str__(self):
        return self.codigo
"""
apps/permisos/models.py
Dominio de permisos granulares del sistema.
Un permiso define una acción permitida dentro de un módulo específico.
"""
from django.db import models


class Permiso(models.Model):
    """
    Permisos granulares por módulo funcional del sistema.
    Ejemplo: codigo='pacientes.crear', modulo='patients'
    """
    id_permiso = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=100, unique=True)
    nombre = models.CharField(max_length=100)
    modulo = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'permisos'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['modulo', 'codigo']

    def __str__(self):
        return f'{self.modulo}.{self.codigo}'

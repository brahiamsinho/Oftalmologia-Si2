"""
Elimina tablas de apps retiradas (diagnosticos, tratamientos, evoluciones, recetas)
y filas huérfanas en django_migrations para que migrate no exija esos módulos.
"""

from django.db import migrations


DROP_SQL = """
DROP TABLE IF EXISTS receta_detalles;
DROP TABLE IF EXISTS recetas;
DROP TABLE IF EXISTS tratamientos_clinicos;
DROP TABLE IF EXISTS evoluciones_clinicas;
DROP TABLE IF EXISTS diagnosticos_clinicos;
"""

CLEAN_MIGRATIONS_SQL = """
DELETE FROM django_migrations
WHERE app IN ('diagnosticos', 'tratamientos', 'evoluciones', 'recetas');
"""


class Migration(migrations.Migration):

    dependencies = [
        ('historial_clinico', '0002_initial'),
    ]

    operations = [
        migrations.RunSQL(DROP_SQL, reverse_sql=migrations.RunSQL.noop),
        migrations.RunSQL(CLEAN_MIGRATIONS_SQL, reverse_sql=migrations.RunSQL.noop),
    ]

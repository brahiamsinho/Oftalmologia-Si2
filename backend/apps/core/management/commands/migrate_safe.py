"""
management command: migrate_safe
=================================
Wrapper sobre `migrate` que adquiere un advisory lock de PostgreSQL antes de
correr las migraciones. Esto garantiza que NUNCA corran dos `migrate` en paralelo,
sin importar cuántos procesos, contenedores o comandos manuales se lancen al mismo tiempo.

Por qué advisory lock y no flock:
  - flock vive en el sistema de archivos del contenedor.
    Si otro proceso usa `python manage.py migrate` directamente (sin flock), el lock
    no tiene efecto → condición de carrera → corrupción en pg_catalog.
  - pg_advisory_lock vive dentro de PostgreSQL: cualquier conexión que intente el
    mismo lock espera automáticamente hasta que la primera termine, sin importar
    desde dónde se ejecute el proceso.

Uso:
  python manage.py migrate_safe            # igual que migrate, pero seguro
  python manage.py migrate_safe --noinput  # para entrypoint / CI
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection

# ID arbitrario de 64 bits para el advisory lock.
# Debe ser único en tu instalación: no lo cambies una vez en producción.
_MIGRATE_LOCK_ID = 0x44_6A61_6E67_6F4D  # "DjangoM" en hex


class Command(BaseCommand):
    help = "Corre 'migrate' protegido por un advisory lock de PostgreSQL para evitar migraciones concurrentes."

    def add_arguments(self, parser):
        # Reenviar los argumentos más usados de `migrate`
        parser.add_argument(
            "--noinput",
            "--no-input",
            action="store_true",
            dest="interactive",
            default=True,
            help="NO interactivo (igual que migrate --noinput).",
        )
        parser.add_argument(
            "--database",
            default="default",
            help="Base de datos a migrar (default: 'default').",
        )
        parser.add_argument(
            "--fake",
            action="store_true",
            help="Marca las migraciones como aplicadas sin ejecutar el SQL.",
        )
        parser.add_argument(
            "--fake-initial",
            action="store_true",
            help="Fake-apply solo las migraciones iniciales si las tablas ya existen.",
        )
        parser.add_argument(
            "--run-syncdb",
            action="store_true",
            help="Crea tablas para apps sin migraciones.",
        )
        parser.add_argument(
            "app_label",
            nargs="?",
            help="App a migrar (opcional).",
        )
        parser.add_argument(
            "migration_name",
            nargs="?",
            help="Migración objetivo (opcional).",
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                "Adquiriendo advisory lock de PostgreSQL para migrate seguro…"
            )
        )

        kwargs = {
            "interactive": not options.get("interactive", True),
            "database": options.get("database", "default"),
            "fake": options.get("fake", False),
            "fake_initial": options.get("fake_initial", False),
            "run_syncdb": options.get("run_syncdb", False),
            "verbosity": options.get("verbosity", 1),
            "stdout": self.stdout,
            "stderr": self.stderr,
        }
        app_label = options.get("app_label")
        migration_name = options.get("migration_name")
        if app_label:
            kwargs["app_label"] = app_label
        if migration_name:
            kwargs["migration_name"] = migration_name

        with connection.cursor() as cursor:
            # Bloqueo exclusivo: espera hasta que ningún otro proceso lo tenga.
            cursor.execute("SELECT pg_advisory_lock(%s)", [_MIGRATE_LOCK_ID])
            self.stdout.write("  Lock adquirido. Corriendo migraciones…")
            try:
                call_command("migrate", **kwargs)
            finally:
                cursor.execute("SELECT pg_advisory_unlock(%s)", [_MIGRATE_LOCK_ID])
                self.stdout.write("  Lock liberado.")

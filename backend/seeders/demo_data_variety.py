"""
Utilidades para datos demo distintos por tenant (schema).

Evita que todas las clínicas muestren los mismos 12 nombres en bucle.
Usa el schema actual + índice del paciente para identidades deterministas e idempotentes.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

from django.db import connection

# Pools ampliados (combinaciones >> 48 pacientes típicos del seeder de reportes)
NOMBRES_POOL = [
    'María', 'José', 'Lucía', 'Carlos', 'Daniela', 'Miguel', 'Andrea', 'Raúl',
    'Paola', 'Héctor', 'Natalia', 'Ricardo', 'Sofía', 'Fernando', 'Valeria', 'Diego',
    'Camila', 'Rodrigo', 'Gabriela', 'Esteban', 'Renata', 'Tomás', 'Isabel', 'Martín',
    'Elena', 'Bruno', 'Adriana', 'Gonzalo', 'Patricia', 'Luis', 'Claudia', 'Marcos',
    'Verónica', 'Julio', 'Beatriz', 'Álvaro', 'Rosa', 'Emilio', 'Teresa', 'Pablo',
]

APELLIDOS_POOL = [
    'Fernández', 'Vargas', 'Mamani', 'Suárez', 'Paredes', 'Rojas', 'Quispe', 'Arce',
    'Medina', 'Flores', 'Soria', 'Herrera', 'Gutiérrez', 'Romero', 'Silva', 'Mendoza',
    'Rivas', 'Paz', 'Salazar', 'Vega', 'Camacho', 'Ortiz', 'Aguilar', 'Castillo',
    'Torres', 'Morales', 'Jiménez', 'Ruiz', 'Díaz', 'Moreno', 'Álvarez', 'Ramos',
    'Chávez', 'Cruz', 'Reyes', 'Guerrero', 'Peña', 'Navarro', 'Ibarra', 'Soliz',
]

ZONAS_POR_TENANT: dict[str, list[str]] = {
    'clinica_norte': ['Equipetrol', 'Urbarí', 'Las Palmas', 'Banzer Norte'],
    'clinica_sur': ['La Guardia', 'El Trompillo', '4to anillo Sur', 'Pampa de la Isla'],
    'clinica_andina': ['Sopocachi', 'Miraflores', 'Calacoto', 'San Miguel'],
    'clinica_pacifico': ['Equipetrol', 'Centro', 'Barrio Lindo', 'Plan 3000'],
    'clinica_prime': ['Equipetrol', 'Las Palmas', 'Urbarí', 'Centro'],
    'clinica_demo': ['Zona Norte', 'Centro', 'Sur', 'Equipetrol'],
}

SCHEMA_CODES: dict[str, str] = {
    'clinica_demo': 'DEMO',
    'clinica_norte': 'CNRT',
    'clinica_sur': 'CSUR',
    'clinica_andina': 'CAND',
    'clinica_pacifico': 'CPAC',
    'clinica_prime': 'CPRM',
}


@dataclass(frozen=True)
class TenantSeedProfile:
    schema_name: str
    code: str
    offset: int
    patients_per_month: int
    email_domain: str


def current_schema_name() -> str:
    return getattr(connection, 'schema_name', None) or 'clinica_demo'


def tenant_code(schema_name: str | None = None) -> str:
    schema = schema_name or current_schema_name()
    if schema in SCHEMA_CODES:
        return SCHEMA_CODES[schema]
    digest = hashlib.sha1(schema.encode()).hexdigest()[:4].upper()
    return digest


def tenant_offset(schema_name: str | None = None) -> int:
    """Desplaza índices de nombres para que cada schema no repita la misma secuencia."""
    schema = schema_name or current_schema_name()
    return int(hashlib.md5(schema.encode()).hexdigest(), 16) % 997


def get_tenant_profile(schema_name: str | None = None) -> TenantSeedProfile:
    schema = schema_name or current_schema_name()
    code = tenant_code(schema)
    offset = tenant_offset(schema)
    # 6–9 pacientes/mes según tenant (6 meses → 36–54 pacientes)
    ppm = 6 + (offset % 4)
    domain = f'{code.lower()}.pacientes.local'
    return TenantSeedProfile(
        schema_name=schema,
        code=code,
        offset=offset,
        patients_per_month=ppm,
        email_domain=domain,
    )


def patient_identity(global_index: int, profile: TenantSeedProfile | None = None) -> tuple[str, str]:
    """Nombre + apellido únicos por (tenant, índice)."""
    prof = profile or get_tenant_profile()
    i = prof.offset + global_index
    nombre = NOMBRES_POOL[i % len(NOMBRES_POOL)]
    apellido = APELLIDOS_POOL[(i * 13 + 7) % len(APELLIDOS_POOL)]
    return nombre, apellido


def patient_document(profile: TenantSeedProfile, year: int, month: int, slot: int) -> str:
    return f'{profile.code}-{year}{month:02d}-{slot:02d}'


def patient_history_number(document: str) -> str:
    return f'HC-{document}'


def patient_email(
    nombre: str,
    apellido: str,
    year: int,
    month: int,
    slot: int,
    profile: TenantSeedProfile,
) -> str:
    n = nombre.lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    a = apellido.lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    return f'{n}.{a}.{year}{month:02d}{slot:02d}@{profile.email_domain}'


def patient_address(global_index: int, profile: TenantSeedProfile) -> str:
    zonas = ZONAS_POR_TENANT.get(
        profile.schema_name,
        ['Centro', 'Norte', 'Sur', 'Este'],
    )
    zona = zonas[global_index % len(zonas)]
    return f'{zona}, Santa Cruz de la Sierra'


def remove_legacy_rpt6m_patients() -> int:
    """
    Elimina pacientes del formato antiguo (RPT6M-*) y sus citas (CASCADE).
    Evita duplicar ~48 filas al pasar al prefijo por clínica (CNRT-, DEMO-, etc.).
    """
    from apps.pacientes.pacientes.models import Paciente

    deleted, _details = (
        Paciente.objects.filter(
            numero_documento__startswith='RPT6M-',
            facturas_clinicas__isnull=True,
        )
        .distinct()
        .delete()
    )
    return deleted


# Documento del paciente demo con cuenta móvil (seed_demo_paciente) — no borrar.
DEMO_PACIENTE_DOCUMENTO = 'DEMO-BRANDON-001'
REPORTING_SEED_TAG = 'analítica de reportes'


def remove_reporting_analytics_patients() -> int:
    """
    Elimina fichas clínicas generadas solo para reportes (sin usuario app).
    Conserva el paciente demo Brandon y cualquier ficha real manual.
    """
    from apps.pacientes.pacientes.models import Paciente

    deleted, _details = (
        Paciente.objects.filter(
            observaciones_generales__icontains=REPORTING_SEED_TAG,
            facturas_clinicas__isnull=True,
        )
        .exclude(numero_documento=DEMO_PACIENTE_DOCUMENTO)
        .distinct()
        .delete()
    )
    return deleted


def reporting_patient_document(profile: TenantSeedProfile, slot: int) -> str:
    """Documento estable por paciente (no uno nuevo por mes)."""
    return f'{profile.code}-RPT-{slot:03d}'

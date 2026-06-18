"""
seeders/seed_ia.py

Datos de demostración CU24 + CU25:
- Clasificaciones de urgencia en distintos niveles
- Derivaciones críticas desde clasificaciones CRITICO

Requiere seeders previos: admin, roles, permisos, demo_paciente, facturacion
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.ia.models import (
    ChatbotUrgencyClassification,
    CriticalHumanHandoff,
    EstadoDerivacionHumana,
    NivelUrgenciaChatbot,
)
from apps.pacientes.pacientes.models import Paciente


CLASIFICACIONES = [
    {
        'mensaje': 'Tengo una cortina negra que me tapa el ojo derecho desde hace 30 minutos',
        'nivel': NivelUrgenciaChatbot.CRITICO,
        'confianza': 0.95,
        'criterios': [
            {'code': 'PERDIDA_VISION_SUBITA', 'label': 'Pérdida súbita de visión', 'level': 'CRITICO', 'matched_terms': ['cortina negra', 'no veo']},
        ],
        'orientacion': 'URGENTE — Acudir a emergencia oftalmológica de inmediato. Sospecha de oclusión vascular retiniana.',
    },
    {
        'mensaje': 'Desde ayer veo lucecitas y moscas volantes, y hoy tengo como una sombra gris',
        'nivel': NivelUrgenciaChatbot.ALTO,
        'confianza': 0.88,
        'criterios': [
            {'code': 'MIODESOPSIAS_SUBITAS', 'label': 'Miodesopsias súbitas', 'level': 'ALTO', 'matched_terms': ['moscas volantes', 'lucecitas']},
            {'code': 'SOMBRA_VISUAL', 'label': 'Sombra visual', 'level': 'ALTO', 'matched_terms': ['sombra gris']},
        ],
        'orientacion': 'ATENCION PRIORITARIA — Evaluar desprendimiento de retina. Consultar en máximo 24 horas.',
    },
    {
        'mensaje': 'Me duele el ojo cuando veo la luz y está rojo desde hace 2 días',
        'nivel': NivelUrgenciaChatbot.MEDIO,
        'confianza': 0.72,
        'criterios': [
            {'code': 'DOLOR_OCULAR', 'label': 'Dolor ocular', 'level': 'MEDIO', 'matched_terms': ['duele el ojo']},
            {'code': 'FOTOFOBIA', 'label': 'Fotofobia', 'level': 'MEDIO', 'matched_terms': ['cuando veo la luz']},
        ],
        'orientacion': 'CONSULTA PREFERENTE — Posible uveítis anterior. Solicitar consulta en los próximos días.',
    },
    {
        'mensaje': 'Quiero saber si tengo descuento en mis lentes nuevos',
        'nivel': NivelUrgenciaChatbot.BAJO,
        'confianza': 0.65,
        'criterios': [],
        'orientacion': 'CONSULTA ADMINISTRATIVA — Derivar a facturación para información sobre descuentos.',
    },
    {
        'mensaje': 'No se que me pasa, a veces veo bien y a veces mal',
        'nivel': NivelUrgenciaChatbot.INSUFICIENTE,
        'confianza': 0.45,
        'criterios': [],
        'orientacion': 'INFORMACION INSUFICIENTE — Solicitar más detalles sobre los síntomas al paciente.',
    },
    {
        'mensaje': 'Chau',
        'nivel': NivelUrgenciaChatbot.INDETERMINADO,
        'confianza': 0.1,
        'criterios': [],
        'orientacion': 'MENSAJE NO CLINICO — El mensaje no contiene información clínica para clasificar.',
    },
]


def run():
    User = get_user_model()
    creados = 0
    existentes = 0

    paciente = Paciente.objects.filter(numero_documento='DEMO-BRANDON-001').first()
    if not paciente:
        raise RuntimeError(
            'No se encontró paciente demo. Ejecutá primero: '
            'python manage.py seed --tenant clinica-demo --only demo_paciente'
        )

    staff = User.objects.filter(tipo_usuario__in=['ADMIN', 'MEDICO']).first()
    if not staff:
        staff = User.objects.filter(is_staff=True).first()

    base_time = timezone.now() - timedelta(days=30)

    classification_map = {}

    for i, c in enumerate(CLASIFICACIONES):
        created_at = base_time + timedelta(hours=i * 36)

        classification, created = ChatbotUrgencyClassification.objects.get_or_create(
            paciente=paciente,
            mensaje_usuario=c['mensaje'],
            defaults={
                'nivel': c['nivel'],
                'confianza': c['confianza'],
                'criterios_detectados': c['criterios'],
                'orientacion': c['orientacion'],
                'requiere_atencion_humana': c['nivel'] == NivelUrgenciaChatbot.CRITICO,
                'created_at': created_at,
                'updated_at': created_at,
            },
        )

        if created:
            creados += 1
            classification_map[classification.nivel] = classification
        else:
            existentes += 1

    critical = ChatbotUrgencyClassification.objects.filter(
        paciente=paciente,
        nivel=NivelUrgenciaChatbot.CRITICO,
    ).first()

    if critical:
        handoff, ho_created = CriticalHumanHandoff.objects.get_or_create(
            classification=critical,
            defaults={
                'paciente': paciente,
                'mensaje_original': critical.mensaje_usuario,
                'nivel_urgencia': NivelUrgenciaChatbot.CRITICO,
                'criterios_detectados': critical.criterios_detectados,
                'estado': EstadoDerivacionHumana.RESUELTA,
                'aceptado_por': staff,
                'aceptado_en': base_time + timedelta(hours=2),
                'resuelto_en': base_time + timedelta(hours=6),
                'created_at': base_time,
                'updated_at': base_time + timedelta(hours=6),
            },
        )

        if ho_created:
            creados += 1
        else:
            existentes += 1

    alto = ChatbotUrgencyClassification.objects.filter(
        paciente=paciente,
        nivel=NivelUrgenciaChatbot.ALTO,
    ).first()

    if alto and not CriticalHumanHandoff.objects.filter(classification=alto).exists():
        CriticalHumanHandoff.objects.create(
            classification=alto,
            paciente=paciente,
            mensaje_original=alto.mensaje_usuario,
            nivel_urgencia=NivelUrgenciaChatbot.ALTO,
            criterios_detectados=alto.criterios_detectados,
            estado=EstadoDerivacionHumana.PENDIENTE,
        )
        creados += 1

    if creados:
        print(
            f'\n  🤖 Clasificaciones demo CU24: '
            f'CRITICO (requiere derivación), ALTO, MEDIO, BAJO, INSUFICIENTE, INDETERMINADO\n'
            f'  Derivaciones CU25: RESUELTA (CRITICO), PENDIENTE (ALTO)\n'
        )

    return creados, existentes

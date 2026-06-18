"""Clasificador determinístico para CU24.

No usa LLM ni servicios externos: una clasificación clínica inicial debe ser
predecible, testeable y auditable. Las reglas son conservadoras y se pueden
expandir luego con configuración por tenant si el alcance lo pide.
"""
from __future__ import annotations

from dataclasses import dataclass
import re
import unicodedata

from apps.ia.models import EstadoDerivacionChatbot, NivelUrgenciaChatbot


@dataclass(frozen=True)
class UrgencyClassificationResult:
    level: str
    confidence: float
    matched_criteria: list[dict]
    orientation: str
    requires_human_attention: bool
    derivation_status: str


@dataclass(frozen=True)
class UrgencyRule:
    code: str
    label: str
    level: str
    confidence: float
    terms: tuple[str, ...] = ()
    all_terms: tuple[str, ...] = ()


_CRITICAL_RULES = (
    UrgencyRule(
        code='sudden_vision_loss',
        label='Pérdida súbita de visión',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.95,
        terms=('perdida subita de vision', 'perdi la vision', 'perdi vision', 'no veo', 'no puedo ver'),
    ),
    UrgencyRule(
        code='chemical_exposure',
        label='Exposición química ocular',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.95,
        terms=('quimico', 'sustancia quimica', 'acido', 'lejia', 'lavandina', 'cal'),
    ),
    UrgencyRule(
        code='ocular_trauma',
        label='Trauma ocular',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.93,
        terms=('trauma', 'golpe en el ojo', 'golpe ocular', 'me golpee el ojo'),
    ),
    UrgencyRule(
        code='severe_pain',
        label='Dolor ocular intenso',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.92,
        terms=('dolor intenso', 'dolor muy fuerte', 'dolor insoportable', 'me duele mucho'),
    ),
    UrgencyRule(
        code='halos_nausea',
        label='Halos con náuseas',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.94,
        all_terms=('halos', 'nauseas'),
    ),
    UrgencyRule(
        code='black_curtain',
        label='Cortina o sombra negra',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.95,
        terms=('cortina negra', 'sombra negra', 'velo negro'),
    ),
    UrgencyRule(
        code='bleeding',
        label='Sangrado ocular',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.9,
        terms=('sangrado', 'sangre en el ojo', 'ojo sangrando'),
    ),
    UrgencyRule(
        code='penetrating_foreign_body',
        label='Cuerpo extraño penetrante',
        level=NivelUrgenciaChatbot.CRITICO,
        confidence=0.96,
        terms=('cuerpo extrano penetrante', 'objeto clavado', 'algo clavado', 'metal clavado', 'vidrio clavado'),
    ),
)

_HIGH_RULES = (
    UrgencyRule(
        code='photophobia',
        label='Fotofobia',
        level=NivelUrgenciaChatbot.ALTO,
        confidence=0.82,
        terms=('fotofobia', 'molesta mucho la luz', 'sensibilidad a la luz'),
    ),
    UrgencyRule(
        code='red_eye_with_pain',
        label='Ojo rojo con dolor',
        level=NivelUrgenciaChatbot.ALTO,
        confidence=0.86,
        all_terms=('ojo rojo', 'dolor'),
    ),
    UrgencyRule(
        code='abundant_discharge',
        label='Secreción abundante',
        level=NivelUrgenciaChatbot.ALTO,
        confidence=0.8,
        terms=('secrecion abundante', 'mucha secrecion', 'pus abundante'),
    ),
    UrgencyRule(
        code='postoperative_pain',
        label='Dolor postoperatorio',
        level=NivelUrgenciaChatbot.ALTO,
        confidence=0.88,
        all_terms=('dolor', 'postoperatorio'),
    ),
    UrgencyRule(
        code='post_surgery_pain',
        label='Dolor posterior a cirugía',
        level=NivelUrgenciaChatbot.ALTO,
        confidence=0.88,
        all_terms=('dolor', 'cirugia'),
    ),
)

_MEDIUM_RULES = (
    UrgencyRule(
        code='red_eye',
        label='Ojo rojo',
        level=NivelUrgenciaChatbot.MEDIO,
        confidence=0.7,
        terms=('ojo rojo', 'ojos rojos'),
    ),
    UrgencyRule(
        code='conjunctivitis',
        label='Conjuntivitis probable',
        level=NivelUrgenciaChatbot.MEDIO,
        confidence=0.72,
        terms=('conjuntivitis',),
    ),
    UrgencyRule(
        code='stye',
        label='Orzuelo',
        level=NivelUrgenciaChatbot.MEDIO,
        confidence=0.68,
        terms=('orzuelo',),
    ),
    UrgencyRule(
        code='gradual_blurry_vision',
        label='Visión borrosa gradual',
        level=NivelUrgenciaChatbot.MEDIO,
        confidence=0.74,
        terms=('vision borrosa gradual', 'vision borrosa hace dias', 'veo borroso hace dias', 'vision borrosa'),
    ),
)

_LOW_RULES = (
    UrgencyRule(
        code='dryness',
        label='Sequedad ocular',
        level=NivelUrgenciaChatbot.BAJO,
        confidence=0.64,
        terms=('sequedad', 'ojo seco', 'ojos secos'),
    ),
    UrgencyRule(
        code='mild_itching',
        label='Picazón leve',
        level=NivelUrgenciaChatbot.BAJO,
        confidence=0.62,
        terms=('picazon leve', 'comezon leve', 'me pica un poco'),
    ),
    UrgencyRule(
        code='eye_strain',
        label='Cansancio visual',
        level=NivelUrgenciaChatbot.BAJO,
        confidence=0.65,
        terms=('cansancio visual', 'vista cansada', 'fatiga visual'),
    ),
)

_RULE_GROUPS = (_CRITICAL_RULES, _HIGH_RULES, _MEDIUM_RULES, _LOW_RULES)

_ORIENTATIONS = {
    NivelUrgenciaChatbot.CRITICO: (
        'Tus síntomas pueden corresponder a una urgencia oftalmológica. '
        'Buscá atención médica inmediata o acudí a guardia oftalmológica. '
        'No te automediques ni esperes a que evolucione.'
    ),
    NivelUrgenciaChatbot.ALTO: (
        'Tus síntomas requieren valoración oftalmológica prioritaria. '
        'Solicitá atención lo antes posible y evitá automedicarte.'
    ),
    NivelUrgenciaChatbot.MEDIO: (
        'Tus síntomas no parecen una emergencia inmediata según estas reglas iniciales, '
        'pero conviene agendar una consulta para evaluación clínica.'
    ),
    NivelUrgenciaChatbot.BAJO: (
        'Tus síntomas parecen de baja urgencia según estas reglas iniciales. '
        'Observá la evolución y solicitá consulta si persisten, empeoran o aparecen dolor/visión borrosa.'
    ),
    NivelUrgenciaChatbot.INSUFICIENTE: (
        'Necesito más información para orientar la urgencia: indicá síntoma principal, '
        'desde cuándo ocurre, si hay dolor, cambios de visión, secreción, golpe o exposición química.'
    ),
    NivelUrgenciaChatbot.INDETERMINADO: (
        'No puedo determinar el nivel de urgencia con la información disponible. '
        'Si sentís dolor intenso, pérdida de visión, trauma o exposición química, buscá atención inmediata.'
    ),
}


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize('NFKD', value or '')
    value = ''.join(ch for ch in value if not unicodedata.combining(ch))
    value = value.lower()
    value = re.sub(r'[^a-z0-9ñ\s]', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def _history_text(history: list[dict] | None) -> str:
    if not history:
        return ''
    contents = [str(item.get('content', '')) for item in history[-5:] if item.get('role') == 'user']
    return ' '.join(contents)


def _matches(rule: UrgencyRule, normalized_text: str) -> list[str]:
    found = [term for term in rule.terms if _contains_term(normalized_text, term)]
    if rule.all_terms and all(_contains_term(normalized_text, term) for term in rule.all_terms):
        found.extend(rule.all_terms)
    return sorted(set(found))


def _contains_term(normalized_text: str, term: str) -> bool:
    normalized_term = _normalize_text(term)
    if not normalized_term:
        return False

    pattern = rf'(?<![a-z0-9ñ]){re.escape(normalized_term)}(?![a-z0-9ñ])'
    return re.search(pattern, normalized_text) is not None


def _criteria(rule: UrgencyRule, matched_terms: list[str]) -> dict:
    return {
        'code': rule.code,
        'label': rule.label,
        'level': rule.level,
        'matched_terms': matched_terms,
    }


def _final_result(level: str, confidence: float, matched_criteria: list[dict]) -> UrgencyClassificationResult:
    is_critical = level == NivelUrgenciaChatbot.CRITICO
    return UrgencyClassificationResult(
        level=level,
        confidence=confidence,
        matched_criteria=matched_criteria,
        orientation=_ORIENTATIONS[level],
        requires_human_attention=is_critical,
        derivation_status=(
            EstadoDerivacionChatbot.PENDIENTE
            if is_critical
            else EstadoDerivacionChatbot.NO_REQUERIDA
        ),
    )


def classify_urgency(message: str, history: list[dict] | None = None) -> UrgencyClassificationResult:
    """Clasifica el nivel de urgencia oftalmológica inicial.

    La prioridad de reglas es descendente: crítico > alto > medio > bajo. Si no
    hay suficientes datos o no matchea nada útil, devuelve estados controlados.
    """

    current_text = _normalize_text(message)
    context_text = _normalize_text(f'{_history_text(history)} {message}')
    if not current_text:
        return _final_result(NivelUrgenciaChatbot.INSUFICIENTE, 0.1, [])

    for rules in _RULE_GROUPS:
        matched_criteria = []
        confidences = []
        for rule in rules:
            matched_terms = _matches(rule, context_text)
            if matched_terms:
                matched_criteria.append(_criteria(rule, matched_terms))
                confidences.append(rule.confidence)
        if matched_criteria:
            level = matched_criteria[0]['level']
            return _final_result(level, max(confidences), matched_criteria)

    tokens = current_text.split()
    if len(current_text) < 12 or len(tokens) < 3:
        return _final_result(NivelUrgenciaChatbot.INSUFICIENTE, 0.2, [])

    return _final_result(NivelUrgenciaChatbot.INDETERMINADO, 0.3, [])

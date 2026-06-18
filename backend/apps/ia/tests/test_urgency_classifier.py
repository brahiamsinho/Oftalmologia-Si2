from apps.ia.models import EstadoDerivacionChatbot, NivelUrgenciaChatbot
from apps.ia.services.urgency_classifier import classify_urgency


def test_clasifica_critico_por_perdida_subita_vision():
    result = classify_urgency('Desde hace 10 minutos no veo por el ojo derecho')

    assert result.level == NivelUrgenciaChatbot.CRITICO
    assert result.requires_human_attention is True
    assert result.derivation_status == EstadoDerivacionChatbot.PENDIENTE
    assert any(item['code'] == 'sudden_vision_loss' for item in result.matched_criteria)


def test_clasifica_alto_por_ojo_rojo_con_dolor():
    result = classify_urgency('Tengo ojo rojo y dolor desde ayer')

    assert result.level == NivelUrgenciaChatbot.ALTO
    assert result.requires_human_attention is False
    assert result.derivation_status == EstadoDerivacionChatbot.NO_REQUERIDA
    assert any(item['code'] == 'red_eye_with_pain' for item in result.matched_criteria)


def test_clasifica_medio_por_orzuelo():
    result = classify_urgency('Me salió un orzuelo en el párpado')

    assert result.level == NivelUrgenciaChatbot.MEDIO


def test_clasifica_bajo_por_cansancio_visual():
    result = classify_urgency('Siento cansancio visual al usar la computadora')

    assert result.level == NivelUrgenciaChatbot.BAJO



def test_clasifica_insuficiente_si_texto_corto_sin_criterios():
    result = classify_urgency('hola')

    assert result.level == NivelUrgenciaChatbot.INSUFICIENTE
    assert result.matched_criteria == []


def test_no_clasifica_critico_por_cal_dentro_de_calor():
    result = classify_urgency('Siento calor alrededor del ojo desde esta mañana')

    assert result.level != NivelUrgenciaChatbot.CRITICO
    assert not any(item['code'] == 'chemical_exposure' for item in result.matched_criteria)


def test_clasifica_indeterminado_si_no_hay_criterios_claros():
    result = classify_urgency('Tengo una molestia rara desde hace varios dias y no se explicar bien')

    assert result.level == NivelUrgenciaChatbot.INDETERMINADO

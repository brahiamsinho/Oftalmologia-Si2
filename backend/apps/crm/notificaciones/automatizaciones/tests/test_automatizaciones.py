from datetime import timedelta

import pytest
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from apps.atencionClinica.cirugias.models import Cirugia
from apps.atencionClinica.citas.models import Cita, EstadoCita, TipoCita, TipoCitaNombre
from apps.atencionClinica.postoperatorio.models import Postoperatorio
from apps.atencionClinica.especialistas.models import Especialista
from apps.crm.notificaciones.automatizaciones.models import (
    EstadoTarea,
    LogEjecucionRecordatorio,
    ReglaRecordatorio,
    TareaRecordatorioProgramada,
    TipoReglaRecordatorio,
)
from apps.pacientes.historial_clinico.models import HistoriaClinica
from apps.pacientes.pacientes.models import Paciente
from apps.tenant.models import Tenant
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def tenant_uno(db):
    return Tenant.objects.create(slug='tenant-notif-uno', nombre='Tenant Notif Uno', activo=True)


@pytest.fixture
def administrativo(db, tenant_uno):
    return Usuario.objects.create_user(
        username='adm_notif',
        email='adm_notif@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='Notif',
        tipo_usuario=TipoUsuario.ADMINISTRATIVO,
        tenant=tenant_uno,
    )


@pytest.fixture
def paciente_user(db, tenant_uno):
    return Usuario.objects.create_user(
        username='pac_notif',
        email='pac_notif@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='Notif',
        tipo_usuario=TipoUsuario.PACIENTE,
        tenant=tenant_uno,
    )


@pytest.fixture
def medico(db, tenant_uno):
    return Usuario.objects.create_user(
        username='med_notif',
        email='med_notif@test.local',
        password='Password123!',
        nombres='Medico',
        apellidos='Notif',
        tipo_usuario=TipoUsuario.MEDICO,
        tenant=tenant_uno,
    )


@pytest.fixture
def especialista(db, medico):
    return Especialista.objects.create(
        usuario=medico,
        codigo_profesional='COL-CU18-001',
        especialidad='Oftalmología',
        activo=True,
    )


@pytest.fixture
def paciente(db, paciente_user, tenant_uno):
    return Paciente.objects.create(
        tenant=tenant_uno,
        usuario=paciente_user,
        numero_historia='HC-CU17-001',
        tipo_documento='DNI',
        numero_documento='DOC-CU17-001',
        nombres='Paciente',
        apellidos='Notif',
    )


@pytest.fixture
def tipo_cita(db):
    tipo, _ = TipoCita.objects.get_or_create(
        nombre=TipoCitaNombre.CONSULTA,
        defaults={'descripcion': 'Consulta'},
    )
    return tipo


@pytest.fixture
def postoperatorio(db, paciente, medico):
    historia = HistoriaClinica.objects.create(id_paciente=paciente)
    cirugia = Cirugia.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        cirujano=medico,
        fecha_programada=timezone.now(),
        procedimiento='Facoemulsificacion',
    )
    return Postoperatorio.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        id_cirugia=cirugia,
        profesional_atiende=medico,
        fecha_control=timezone.now(),
        proximo_control=timezone.now() + timedelta(days=2),
        estado_postoperatorio='EN_OBSERVACION',
    )


@pytest.mark.django_db
def test_crear_regla_recordatorio(api_client, administrativo):
    api_client.force_authenticate(user=administrativo)
    payload = {
        'nombre': 'Control 24h',
        'tipo_regla': 'CONTROL_POSTOPERATORIO',
        'horas_antes': 24,
        'titulo_template': 'Recordatorio para {paciente}',
        'cuerpo_template': 'Tu control es el {fecha_control}',
        'activa': True,
    }
    response = api_client.post(
        '/api/notificaciones/reglas/',
        payload,
        format='json',
        HTTP_X_TENANT_SLUG=administrativo.tenant.slug,
    )
    assert response.status_code == 201
    assert response.data['nombre'] == 'Control 24h'


@pytest.mark.django_db
def test_generar_tarea_programada(api_client, administrativo, postoperatorio, tenant_uno):
    api_client.force_authenticate(user=administrativo)
    regla = api_client.post(
        '/api/notificaciones/reglas/',
        {
            'nombre': 'Control 12h',
            'tipo_regla': 'CONTROL_POSTOPERATORIO',
            'horas_antes': 12,
            'titulo_template': 'Control de {paciente}',
            'cuerpo_template': 'Fecha {fecha_control}',
            'activa': True,
        },
        format='json',
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
    ).data

    response = api_client.post(
        '/api/notificaciones/tareas/generar/',
        {'id_regla': regla['id_regla'], 'id_postoperatorio': postoperatorio.id_postoperatorio},
        format='json',
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
    )
    assert response.status_code == 201
    assert response.data['estado'] == EstadoTarea.PENDIENTE


@pytest.mark.django_db
def test_autoprogramar_tarea_al_crear_cita(paciente, especialista, tipo_cita):
    regla = ReglaRecordatorio.objects.create(
        nombre='Cita 24h test',
        tipo_regla=TipoReglaRecordatorio.RECORDATORIO_CITA,
        horas_antes=24,
        titulo_template='Cita {paciente}',
        cuerpo_template='El {fecha_cita}',
        activa=True,
    )

    inicio = timezone.now() + timedelta(days=3)
    cita = Cita.objects.create(
        id_paciente=paciente,
        id_especialista=especialista,
        id_tipo_cita=tipo_cita,
        fecha_hora_inicio=inicio,
        fecha_hora_fin=inicio + timedelta(hours=1),
        estado=EstadoCita.CONFIRMADA,
        motivo='Control',
    )

    tareas = TareaRecordatorioProgramada.objects.filter(
        id_cita=cita,
        id_regla=regla,
        estado=EstadoTarea.PENDIENTE,
    )
    assert tareas.exists()


@pytest.mark.django_db
def test_cancelar_tareas_si_cita_cancelada(paciente, especialista, tipo_cita):
    ReglaRecordatorio.objects.create(
        nombre='Cita cancel test',
        tipo_regla=TipoReglaRecordatorio.RECORDATORIO_CITA,
        horas_antes=24,
        titulo_template='Cita {paciente}',
        cuerpo_template='El {fecha_cita}',
        activa=True,
    )

    inicio = timezone.now() + timedelta(days=3)
    cita = Cita.objects.create(
        id_paciente=paciente,
        id_especialista=especialista,
        id_tipo_cita=tipo_cita,
        fecha_hora_inicio=inicio,
        fecha_hora_fin=inicio + timedelta(hours=1),
        estado=EstadoCita.CONFIRMADA,
        motivo='Control',
    )

    cita.estado = EstadoCita.CANCELADA
    cita.save(update_fields=['estado'])

    pendientes = TareaRecordatorioProgramada.objects.filter(
        id_cita=cita,
        estado=EstadoTarea.PENDIENTE,
    )
    assert not pendientes.exists()
    assert TareaRecordatorioProgramada.objects.filter(
        id_cita=cita,
        estado=EstadoTarea.CANCELADA,
    ).exists()


@pytest.mark.django_db
def test_procesamiento_genera_log_exitoso(postoperatorio):
    regla = ReglaRecordatorio.objects.create(
        nombre='Control 1h',
        horas_antes=1,
        titulo_template='Recordatorio para {paciente}',
        cuerpo_template='Control: {fecha_control}',
        activa=True,
    )
    TareaRecordatorioProgramada.objects.create(
        id_regla=regla,
        id_paciente=postoperatorio.id_paciente,
        id_postoperatorio=postoperatorio,
        programada_para=timezone.now() - timedelta(minutes=1),
        payload={'ok': True},
    )

    call_command('procesar_recordatorios', '--limit', '10')

    tarea = TareaRecordatorioProgramada.objects.first()
    assert tarea.estado == EstadoTarea.PROCESADA
    assert LogEjecucionRecordatorio.objects.filter(id_tarea=tarea, nivel='INFO').exists()


@pytest.mark.django_db
def test_fallo_controlado_registra_error(postoperatorio):
    regla = ReglaRecordatorio.objects.create(
        nombre='Control error',
        horas_antes=1,
        titulo_template='Recordatorio para {paciente}',
        cuerpo_template='Control: {fecha_control}',
        activa=True,
    )
    tarea = TareaRecordatorioProgramada.objects.create(
        id_regla=regla,
        id_paciente=postoperatorio.id_paciente,
        id_postoperatorio=postoperatorio,
        programada_para=timezone.now() - timedelta(minutes=1),
        payload={'forzar_error': True},
    )

    call_command('procesar_recordatorios', '--limit', '10')

    tarea.refresh_from_db()
    assert tarea.estado == EstadoTarea.ERROR
    assert tarea.intentos == 1
    assert LogEjecucionRecordatorio.objects.filter(id_tarea=tarea, nivel='ERROR').exists()


@pytest.mark.django_db
def test_seed_recordatorios():
    from seeders import seed_recordatorios

    creados, actualizados = seed_recordatorios.run()
    assert creados + actualizados >= 2
    assert ReglaRecordatorio.objects.filter(
        tipo_regla=TipoReglaRecordatorio.RECORDATORIO_CITA,
    ).exists()

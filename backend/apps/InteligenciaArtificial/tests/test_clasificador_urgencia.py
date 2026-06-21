from django.contrib.auth import get_user_model
from django.test import TestCase
from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.InteligenciaArtificial.models import (
    ClasificacionUrgencia,
    EstadoClasificacionUrgencia,
    InteraccionAsistenteVirtual,
    NivelUrgenciaClasificacion,
)
from apps.InteligenciaArtificial.services.asistente_virtual import AsistenteVirtualService
from apps.InteligenciaArtificial.services.clasificador_urgencia import ClasificadorUrgenciaService
from apps.InteligenciaArtificial.views import AsistenteVirtualPacienteViewSet
from apps.crm.notificaciones.models import Notificacion
from apps.tenant.models import Domain, Tenant


User = get_user_model()


class ClasificadorUrgenciaServiceTest(TestCase):
    def setUp(self):
        with schema_context(get_public_schema_name()):
            self.tenant = Tenant.objects.create(
                schema_name='cu24_test',
                slug='cu24-test',
                nombre='CU24 Test',
                activo=True,
            )
            Domain.objects.create(tenant=self.tenant, domain='cu24-test.localhost', is_primary=True)

        with schema_context(self.tenant.schema_name):
            self.user = User.objects.create_user(
                username='paciente_cu24',
                email='paciente_cu24@example.com',
                password='testpass123',
                nombres='Paciente',
                apellidos='Urgencia',
                tipo_usuario='PACIENTE',
            )

    def _crear_interaccion(self, mensaje: str):
        with schema_context(self.tenant.schema_name):
            resultado = AsistenteVirtualService.responder(mensaje)
            return InteraccionAsistenteVirtual.objects.create(
                id_usuario=self.user,
                mensaje=mensaje,
                respuesta=resultado.respuesta,
                intencion=resultado.intencion,
                estado=resultado.estado,
                requiere_clasificacion_urgencia=resultado.requiere_clasificacion_urgencia,
                nivel_prioridad=resultado.nivel_prioridad,
                sintomas_detectados=resultado.sintomas_detectados,
                metadata=resultado.metadata,
            )

    def test_clasifica_urgencia_critica(self):
        with schema_context(self.tenant.schema_name):
            interaccion = self._crear_interaccion('Tengo perdida subita de vision y dolor ocular intenso ahora mismo.')

            clasificacion = ClasificadorUrgenciaService.clasificar_interaccion(interaccion)

            self.assertEqual(clasificacion.nivel_urgencia, NivelUrgenciaClasificacion.CRITICA)
            self.assertTrue(clasificacion.requiere_derivacion)
            self.assertGreaterEqual(clasificacion.puntaje_riesgo, 75)
            self.assertEqual(clasificacion.estado, EstadoClasificacionUrgencia.PENDIENTE)

    def test_clasifica_urgencia_media(self):
        with schema_context(self.tenant.schema_name):
            interaccion = self._crear_interaccion('Tengo vision borrosa leve.')

            clasificacion = ClasificadorUrgenciaService.clasificar_interaccion(interaccion)

            self.assertEqual(clasificacion.nivel_urgencia, NivelUrgenciaClasificacion.MEDIA)
            self.assertFalse(clasificacion.requiere_derivacion)
            self.assertGreaterEqual(clasificacion.puntaje_riesgo, 25)


class AsistenteVirtualCu24IntegrationTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        with schema_context(get_public_schema_name()):
            self.tenant = Tenant.objects.create(
                schema_name='cu24_api_test',
                slug='cu24-api-test',
                nombre='CU24 API Test',
                activo=True,
            )
            Domain.objects.create(tenant=self.tenant, domain='cu24-api-test.localhost', is_primary=True)

        with schema_context(self.tenant.schema_name):
            self.user = User.objects.create_user(
                username='paciente_cu24_api',
                email='paciente_cu24_api@example.com',
                password='testpass123',
                nombres='Paciente',
                apellidos='Api',
                tipo_usuario='PACIENTE',
            )

    def test_consulta_urgente_autocrea_clasificacion(self):
        staff_users = []
        with schema_context(self.tenant.schema_name):
            staff_users = [
                User.objects.create_user(
                    username='adm_cu24',
                    email='adm_cu24@example.com',
                    password='testpass123',
                    nombres='Admin',
                    apellidos='CU24',
                    tipo_usuario='ADMINISTRATIVO',
                ),
                User.objects.create_user(
                    username='med_cu24',
                    email='med_cu24@example.com',
                    password='testpass123',
                    nombres='Medico',
                    apellidos='CU24',
                    tipo_usuario='MEDICO',
                ),
            ]
            view = AsistenteVirtualPacienteViewSet.as_view({'post': 'consultar'})
            request = self.factory.post(
                '/t/cu24-api-test/api/inteligencia-artificial/asistente-virtual/',
                {'mensaje': 'Tengo vision borrosa leve.'},
                format='json',
            )
            force_authenticate(request, user=self.user)

            response = view(request)

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['requiere_clasificacion_urgencia'])
        self.assertIn('clasificacion_urgencia', response.data)
        self.assertEqual(
            response.data['clasificacion_urgencia']['estado'],
            EstadoClasificacionUrgencia.PENDIENTE,
        )
        self.assertEqual(response.data['clasificacion_urgencia']['nivel_urgencia'], 'MEDIA')

        with schema_context(self.tenant.schema_name):
            self.assertEqual(ClasificacionUrgencia.objects.count(), 1)
            self.assertEqual(ClasificacionUrgencia.objects.first().id_usuario, self.user)
            self.assertEqual(Notificacion.objects.filter(tipo='clasificacion_urgencia').count(), len(staff_users))

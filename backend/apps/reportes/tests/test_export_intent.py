from django.test import SimpleTestCase

from apps.reportes.services.export_intent import parse_export_formats_from_query


class ExportIntentTests(SimpleTestCase):
    def test_excel_and_pdf(self):
        q = 'Listar pacientes con estado ACTIVO en excel y pdf'
        self.assertEqual(parse_export_formats_from_query(q), ['excel', 'pdf'])

    def test_no_formats(self):
        self.assertEqual(parse_export_formats_from_query('pacientes activos'), [])

    def test_csv_only(self):
        self.assertEqual(parse_export_formats_from_query('exportar csv de citas'), ['csv'])

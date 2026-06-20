import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/factura_resumen.dart';

final facturacionRepositoryProvider =
    Provider<FacturacionRepository>((_) => FacturacionRepository());

/// CU21 — Facturación, cobros y pasarela de pago.
class FacturacionRepository {
  FacturacionRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  String _toAbsoluteUrl(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return '';
    final parsed = Uri.tryParse(trimmed);
    if (parsed != null && parsed.hasScheme) return trimmed;

    final base = Uri.parse(_dio.options.baseUrl);
    if (trimmed.startsWith('/')) {
      return base.replace(path: trimmed, query: null, fragment: null).toString();
    }
    return base.resolve(trimmed).toString();
  }

  /// GET `facturacion/facturas/` — facturas del paciente autenticado.
  Future<List<FacturaResumen>> fetchMisFacturas({String? estado}) async {
    try {
      final response = await _dio.get<dynamic>(
        'facturacion/facturas/',
        queryParameters: estado != null ? {'estado': estado} : null,
      );
      final raw = response.data;
      final list = raw is Map ? (raw['results'] as List? ?? []) : raw as List;
      return list
          .map((e) => FacturaResumen.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// GET `facturacion/facturas/<id>/comprobante/` — texto del comprobante.
  Future<String> fetchComprobante(String idFactura) async {
    try {
      final response = await _dio.get<dynamic>('facturacion/facturas/$idFactura/comprobante/');
      final body = response.data;
      if (body is Map) {
        return body['texto']?.toString() ??
            body['comprobante']?.toString() ??
            body.toString();
      }
      return body.toString();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// GET `facturacion/facturas/<id>/comprobante/` — PDF del comprobante.
  Future<List<int>> fetchComprobantePdf(String idFactura) async {
    try {
      final response = await _dio.get<List<int>>(
        'facturacion/facturas/$idFactura/comprobante/',
        options: Options(
          responseType: ResponseType.bytes,
          headers: const {'Accept': 'application/pdf'},
        ),
      );
      return response.data ?? const <int>[];
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// POST `facturacion/facturas/<id>/iniciar-pago-en-linea/` — obtiene URL de pasarela.
  Future<String> iniciarPagoEnLinea(String idFactura) async {
    try {
      final response = await _dio.post<dynamic>(
        'facturacion/facturas/$idFactura/iniciar-pago-en-linea/',
      );
      final body = response.data as Map<String, dynamic>;
      final rawUrl = body['checkout_url']?.toString() ??
          body['url']?.toString() ??
          body['url_pago']?.toString() ??
          '';
      return _toAbsoluteUrl(rawUrl);
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// POST `facturacion/facturas/<id>/confirmar-pago-mock/` — confirma pago demo.
  Future<void> confirmarPagoMock(String idFactura) async {
    try {
      await _dio.post<dynamic>('facturacion/facturas/$idFactura/confirmar-pago-mock/');
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  static String _msg(DioException e) {
    final code = e.response?.statusCode;
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      final detail = data['detail'];
      if (detail is String && detail.trim().isNotEmpty) return detail.trim();
      final nonField = data['non_field_errors'];
      if (nonField is List && nonField.isNotEmpty) {
        return nonField.first.toString();
      }
    }
    if (code == 401 || code == 403) return 'No autorizado para ver facturas.';
    if (code == 404) return 'Factura no encontrada.';
    if (e.type == DioExceptionType.connectionError) return 'Sin conexión al servidor.';
    return 'No se pudieron cargar las facturas.';
  }
}

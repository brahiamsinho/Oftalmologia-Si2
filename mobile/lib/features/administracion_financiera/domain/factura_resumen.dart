/// CU21 — Modelos de facturación y cobros del paciente.

enum EstadoFactura {
  pendiente,
  pagada,
  anulada,
  vencida;

  static EstadoFactura fromString(String? s) {
    switch (s?.toUpperCase()) {
      case 'PENDIENTE':
      case 'EMITIDA':
      case 'PAGADA_PARCIAL':
      case 'BORRADOR':
        return EstadoFactura.pendiente;
      case 'PAGADA':
        return EstadoFactura.pagada;
      case 'ANULADA':
        return EstadoFactura.anulada;
      case 'VENCIDA':
        return EstadoFactura.vencida;
      default:
        return EstadoFactura.pendiente;
    }
  }
}

class FacturaResumen {
  const FacturaResumen({
    required this.idFactura,
    required this.numeroFactura,
    required this.estado,
    required this.montoTotal,
    required this.fechaEmision,
    this.fechaVencimiento,
    this.montoPagado,
    this.saldoPendiente,
    this.descripcionServicio,
    this.montoDescuento,
    this.copago,
  });

  final String idFactura;
  final String numeroFactura;
  final EstadoFactura estado;
  final double montoTotal;
  final DateTime fechaEmision;
  final DateTime? fechaVencimiento;
  final double? montoPagado;
  final double? saldoPendiente;
  final String? descripcionServicio;
  final double? montoDescuento;
  final double? copago;

  static double _asDouble(dynamic raw) {
    if (raw == null) return 0;
    if (raw is num) return raw.toDouble();
    if (raw is String) {
      final cleaned = raw.trim().replaceAll(',', '.');
      return double.tryParse(cleaned) ?? 0;
    }
    return 0;
  }

  factory FacturaResumen.fromJson(Map<String, dynamic> j) => FacturaResumen(
        idFactura: j['id_factura']?.toString() ?? '',
        numeroFactura: j['numero_factura']?.toString() ?? '',
        estado: EstadoFactura.fromString(j['estado']?.toString()),
        montoTotal: _asDouble(j['monto_total']),
        fechaEmision: DateTime.tryParse(j['fecha_emision']?.toString() ?? '') ?? DateTime.now(),
        fechaVencimiento: j['fecha_vencimiento'] != null
            ? DateTime.tryParse(j['fecha_vencimiento'].toString())
            : null,
        montoPagado:
            j['monto_pagado'] == null ? null : _asDouble(j['monto_pagado']),
        saldoPendiente: j['saldo_pendiente'] == null
            ? null
            : _asDouble(j['saldo_pendiente']),
        descripcionServicio: j['descripcion_servicio']?.toString() ??
            j['servicio']?.toString(),
        montoDescuento: j['monto_descuento'] == null
            ? null
            : _asDouble(j['monto_descuento']),
        copago: j['copago'] == null ? null : _asDouble(j['copago']),
      );

  bool get tieneSaldo => (saldoPendiente ?? 0) > 0;
}

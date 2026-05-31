/// CU21 — Modelos de facturación y cobros del paciente.

enum EstadoFactura {
  pendiente,
  pagada,
  anulada,
  vencida;

  static EstadoFactura fromString(String? s) {
    switch (s?.toUpperCase()) {
      case 'PENDIENTE':
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

  factory FacturaResumen.fromJson(Map<String, dynamic> j) => FacturaResumen(
        idFactura: j['id_factura']?.toString() ?? '',
        numeroFactura: j['numero_factura']?.toString() ?? '',
        estado: EstadoFactura.fromString(j['estado']?.toString()),
        montoTotal: (j['monto_total'] as num?)?.toDouble() ?? 0,
        fechaEmision: DateTime.tryParse(j['fecha_emision']?.toString() ?? '') ?? DateTime.now(),
        fechaVencimiento: j['fecha_vencimiento'] != null
            ? DateTime.tryParse(j['fecha_vencimiento'].toString())
            : null,
        montoPagado: (j['monto_pagado'] as num?)?.toDouble(),
        saldoPendiente: (j['saldo_pendiente'] as num?)?.toDouble(),
        descripcionServicio: j['descripcion_servicio']?.toString() ??
            j['servicio']?.toString(),
        montoDescuento: (j['monto_descuento'] as num?)?.toDouble(),
        copago: (j['copago'] as num?)?.toDouble(),
      );

  bool get tieneSaldo => (saldoPendiente ?? 0) > 0;
}

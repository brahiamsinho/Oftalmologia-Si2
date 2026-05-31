/// CU19 — Modelos de seguros y cobertura del paciente.

class SeguroClinica {
  const SeguroClinica({
    required this.idSeguro,
    required this.nombre,
    required this.tipoSeguro,
    this.descripcion,
    this.coberturaMaximaAnual,
    this.porcentajeCobertura,
  });

  final String idSeguro;
  final String nombre;
  final String tipoSeguro;
  final String? descripcion;
  final double? coberturaMaximaAnual;
  final double? porcentajeCobertura;

  factory SeguroClinica.fromJson(Map<String, dynamic> j) => SeguroClinica(
        idSeguro: j['id_seguro']?.toString() ?? '',
        nombre: j['nombre']?.toString() ?? '',
        tipoSeguro: j['tipo_seguro']?.toString() ?? '',
        descripcion: j['descripcion']?.toString(),
        coberturaMaximaAnual: (j['cobertura_maxima_anual'] as num?)?.toDouble(),
        porcentajeCobertura: (j['porcentaje_cobertura'] as num?)?.toDouble(),
      );
}

class AfiliacionSeguro {
  const AfiliacionSeguro({
    required this.idAfiliacion,
    required this.seguro,
    required this.numeroPoliza,
    required this.fechaInicio,
    this.fechaVencimiento,
    this.vigente,
    this.coberturaUsadaAnual,
    this.saldoCoberturaAnual,
  });

  final String idAfiliacion;
  final SeguroClinica seguro;
  final String numeroPoliza;
  final DateTime fechaInicio;
  final DateTime? fechaVencimiento;
  final bool? vigente;
  final double? coberturaUsadaAnual;
  final double? saldoCoberturaAnual;

  factory AfiliacionSeguro.fromJson(Map<String, dynamic> j) {
    final segData = j['seguro'] as Map<String, dynamic>?;
    return AfiliacionSeguro(
      idAfiliacion: j['id_afiliacion']?.toString() ?? '',
      seguro: segData != null
          ? SeguroClinica.fromJson(segData)
          : SeguroClinica(
              idSeguro: j['id_seguro']?.toString() ?? '',
              nombre: j['nombre_seguro']?.toString() ?? 'Seguro',
              tipoSeguro: '',
            ),
      numeroPoliza: j['numero_poliza']?.toString() ?? '',
      fechaInicio: DateTime.tryParse(j['fecha_inicio']?.toString() ?? '') ?? DateTime.now(),
      fechaVencimiento: j['fecha_vencimiento'] != null
          ? DateTime.tryParse(j['fecha_vencimiento'].toString())
          : null,
      vigente: j['vigente'] as bool?,
      coberturaUsadaAnual: (j['cobertura_usada_anual'] as num?)?.toDouble(),
      saldoCoberturaAnual: (j['saldo_cobertura_anual'] as num?)?.toDouble(),
    );
  }
}

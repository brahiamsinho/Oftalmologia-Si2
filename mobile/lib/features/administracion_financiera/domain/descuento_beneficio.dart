/// CU20 — Modelos de descuentos y beneficios del paciente.

class PromocionDescuento {
  const PromocionDescuento({
    required this.idPromocion,
    required this.nombre,
    required this.tipoDescuento,
    this.descripcion,
    this.valorDescuento,
    this.porcentajeDescuento,
    this.fechaInicio,
    this.fechaFin,
    this.vigente,
  });

  final String idPromocion;
  final String nombre;
  final String tipoDescuento;
  final String? descripcion;
  final double? valorDescuento;
  final double? porcentajeDescuento;
  final DateTime? fechaInicio;
  final DateTime? fechaFin;
  final bool? vigente;

  factory PromocionDescuento.fromJson(Map<String, dynamic> j) => PromocionDescuento(
        idPromocion: j['id_promocion']?.toString() ?? '',
        nombre: j['nombre']?.toString() ?? '',
        tipoDescuento: j['tipo_descuento']?.toString() ?? '',
        descripcion: j['descripcion']?.toString(),
        valorDescuento: (j['valor_descuento'] as num?)?.toDouble(),
        porcentajeDescuento: (j['porcentaje_descuento'] as num?)?.toDouble(),
        fechaInicio: j['fecha_inicio'] != null
            ? DateTime.tryParse(j['fecha_inicio'].toString())
            : null,
        fechaFin: j['fecha_fin'] != null
            ? DateTime.tryParse(j['fecha_fin'].toString())
            : null,
        vigente: j['vigente'] as bool?,
      );

  /// Texto de descuento (ej. "20%" o "Q50.00")
  String get valorDisplay {
    if (porcentajeDescuento != null && porcentajeDescuento! > 0) {
      return '${porcentajeDescuento!.toStringAsFixed(0)}%';
    }
    if (valorDescuento != null && valorDescuento! > 0) {
      return 'Q${valorDescuento!.toStringAsFixed(2)}';
    }
    return '—';
  }
}

class BeneficioPaciente {
  const BeneficioPaciente({
    required this.idBeneficio,
    required this.promocion,
    required this.fechaAsignacion,
    this.utilizado,
    this.fechaUtilizacion,
  });

  final String idBeneficio;
  final PromocionDescuento promocion;
  final DateTime fechaAsignacion;
  final bool? utilizado;
  final DateTime? fechaUtilizacion;

  factory BeneficioPaciente.fromJson(Map<String, dynamic> j) {
    final promoData = j['promocion'] as Map<String, dynamic>?;
    return BeneficioPaciente(
      idBeneficio: j['id_beneficio']?.toString() ?? '',
      promocion: promoData != null
          ? PromocionDescuento.fromJson(promoData)
          : PromocionDescuento(
              idPromocion: '',
              nombre: j['nombre_promocion']?.toString() ?? 'Descuento',
              tipoDescuento: '',
            ),
      fechaAsignacion: DateTime.tryParse(j['fecha_asignacion']?.toString() ?? '') ?? DateTime.now(),
      utilizado: j['utilizado'] as bool?,
      fechaUtilizacion: j['fecha_utilizacion'] != null
          ? DateTime.tryParse(j['fecha_utilizacion'].toString())
          : null,
    );
  }
}

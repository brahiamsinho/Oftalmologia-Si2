import 'package:equatable/equatable.dart';

/// Consulta del paciente (GET `consultas/lista/`).
class ConsultaResumen extends Equatable {
  const ConsultaResumen({
    required this.id,
    required this.fecha,
    required this.motivo,
    this.citaId,
  });

  final int id;
  final DateTime fecha;
  final String motivo;
  final int? citaId;

  factory ConsultaResumen.fromJson(Map<String, dynamic> json) {
    return ConsultaResumen(
      id: json['id'] as int,
      fecha: DateTime.parse(json['fecha'] as String),
      motivo: (json['motivo'] as String?)?.trim() ?? '',
      citaId: json['cita'] as int?,
    );
  }

  @override
  List<Object?> get props => [id, fecha, motivo, citaId];
}

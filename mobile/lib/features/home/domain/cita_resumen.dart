import 'package:equatable/equatable.dart';

/// Cita para listados del paciente (payload de GET `citas/`).
class CitaResumen extends Equatable {
  const CitaResumen({
    required this.idCita,
    required this.fechaHoraInicio,
    required this.fechaHoraFin,
    required this.especialistaNombre,
    required this.tipoCitaNombre,
    required this.motivo,
    required this.estado,
    this.observaciones,
    this.pacienteNombre,
  });

  final int idCita;
  final DateTime fechaHoraInicio;
  final DateTime fechaHoraFin;
  final String especialistaNombre;
  final String tipoCitaNombre;
  final String? motivo;
  final String estado;
  final String? observaciones;
  /// Presente en respuestas de staff/admin (listado de citas).
  final String? pacienteNombre;

  factory CitaResumen.fromJson(Map<String, dynamic> json) {
    return CitaResumen(
      idCita: json['id_cita'] as int,
      fechaHoraInicio: DateTime.parse(json['fecha_hora_inicio'] as String),
      fechaHoraFin: DateTime.parse(json['fecha_hora_fin'] as String),
      especialistaNombre: json['especialista_nombre'] as String? ?? '—',
      tipoCitaNombre: json['tipo_cita_nombre'] as String? ?? '—',
      motivo: json['motivo'] as String?,
      estado: json['estado'] as String? ?? '',
      observaciones: json['observaciones'] as String?,
      pacienteNombre: json['paciente_nombre'] as String?,
    );
  }

  String get motivoDisplay =>
      (motivo != null && motivo!.trim().isNotEmpty) ? motivo!.trim() : tipoCitaNombre;

  @override
  List<Object?> get props => [
        idCita,
        fechaHoraInicio,
        fechaHoraFin,
        especialistaNombre,
        tipoCitaNombre,
        motivo,
        estado,
        observaciones,
        pacienteNombre,
      ];
}

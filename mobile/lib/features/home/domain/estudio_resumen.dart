import 'package:equatable/equatable.dart';

/// Estudio oftalmológico (GET `consultas/estudios/`).
class EstudioResumen extends Equatable {
  const EstudioResumen({
    required this.id,
    required this.fecha,
    required this.tipoEstudio,
    this.observaciones,
    this.ojoDerecho,
    this.ojoIzquierdo,
  });

  final int id;
  final DateTime fecha;
  final String tipoEstudio;
  final String? observaciones;
  final String? ojoDerecho;
  final String? ojoIzquierdo;

  factory EstudioResumen.fromJson(Map<String, dynamic> json) {
    return EstudioResumen(
      id: json['id'] as int,
      fecha: DateTime.parse(json['fecha'] as String),
      tipoEstudio: (json['tipo_estudio'] as String?)?.trim() ?? 'otros',
      observaciones: json['observaciones'] as String?,
      ojoDerecho: json['ojo_derecho'] as String?,
      ojoIzquierdo: json['ojo_izquierdo'] as String?,
    );
  }

  static const Map<String, String> _tipoLabels = {
    'agudeza_visual': 'Agudeza visual',
    'refraccion': 'Refracción',
    'tonometria': 'Tonometría',
    'fondo_ojo': 'Fondo de ojo',
    'topografia': 'Topografía corneal',
    'paquimetria': 'Paquimetría',
    'tomografia': 'Tomografía (OCT)',
    'campo_visual': 'Campo visual',
    'otros': 'Otros',
  };

  String get tipoLabel => _tipoLabels[tipoEstudio] ?? tipoEstudio;

  @override
  List<Object?> get props =>
      [id, fecha, tipoEstudio, observaciones, ojoDerecho, ojoIzquierdo];
}

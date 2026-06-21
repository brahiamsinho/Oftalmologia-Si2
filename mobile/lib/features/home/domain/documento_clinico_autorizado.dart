class DocumentoClinicoAutorizado {
  const DocumentoClinicoAutorizado({
    required this.idDocumentoClinico,
    required this.idHistoriaClinica,
    required this.idPaciente,
    required this.pacienteNombre,
    required this.tipoDocumento,
    required this.estado,
    required this.titulo,
    required this.contenido,
    required this.nombreArchivoDescarga,
    required this.fechaEmision,
    required this.autorizadoPorNombre,
    required this.autorizadoEn,
  });

  final int idDocumentoClinico;
  final int idHistoriaClinica;
  final int idPaciente;
  final String pacienteNombre;
  final String tipoDocumento;
  final String estado;
  final String titulo;
  final String contenido;
  final String nombreArchivoDescarga;
  final DateTime fechaEmision;
  final String? autorizadoPorNombre;
  final DateTime? autorizadoEn;

  factory DocumentoClinicoAutorizado.fromJson(Map<String, dynamic> json) {
    return DocumentoClinicoAutorizado(
      idDocumentoClinico: (json['id_documento_clinico'] as num?)?.toInt() ?? 0,
      idHistoriaClinica: (json['id_historia_clinica'] as num?)?.toInt() ?? 0,
      idPaciente: (json['id_paciente'] as num?)?.toInt() ?? 0,
      pacienteNombre: json['paciente_nombre'] as String? ?? '',
      tipoDocumento: json['tipo_documento'] as String? ?? 'RECETA',
      estado: json['estado'] as String? ?? 'BORRADOR',
      titulo: json['titulo'] as String? ?? '',
      contenido: json['contenido'] as String? ?? '',
      nombreArchivoDescarga: json['nombre_archivo_descarga'] as String? ?? '',
      fechaEmision: DateTime.tryParse(json['fecha_emision']?.toString() ?? '') ?? DateTime.now(),
      autorizadoPorNombre: json['autorizado_por_nombre'] as String?,
      autorizadoEn: DateTime.tryParse(json['autorizado_en']?.toString() ?? ''),
    );
  }

  bool get estaAutorizado => estado.toUpperCase() == 'AUTORIZADO';
}

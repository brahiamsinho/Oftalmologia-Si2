import 'package:equatable/equatable.dart';

enum PatientAssistantIntent {
  citasHorarios,
  procedimientos,
  preoperatorio,
  postoperatorio,
  segurosFacturacion,
  sistema,
  saludo,
  urgencia,
  fueraAlcance,
  noComprendida,
}

enum PatientAssistantState {
  respondida,
  requiereCu24,
  fueraAlcance,
  noComprendida,
}

enum PatientUrgencyPriority {
  noAplica,
  baja,
  media,
  alta,
}

enum PatientUrgencyLevel {
  baja,
  media,
  alta,
  critica,
}

enum PatientUrgencyClassificationState {
  pendiente,
  revisado,
  derivado,
}

class PatientUrgencyClassification extends Equatable {
  const PatientUrgencyClassification({
    required this.idClasificacion,
    required this.idInteraccion,
    required this.idUsuario,
    required this.nivelUrgencia,
    required this.puntajeRiesgo,
    required this.factoresClinicos,
    required this.criteriosEvaluados,
    required this.recomendacion,
    required this.requiereDerivacion,
    required this.estado,
    required this.fechaCreacion,
    this.revisadoPor,
    this.fechaRevision,
    this.notasInternas,
  });

  final int idClasificacion;
  final int idInteraccion;
  final int idUsuario;
  final PatientUrgencyLevel nivelUrgencia;
  final int puntajeRiesgo;
  final List<Map<String, dynamic>> factoresClinicos;
  final Map<String, dynamic> criteriosEvaluados;
  final String recomendacion;
  final bool requiereDerivacion;
  final PatientUrgencyClassificationState estado;
  final int? revisadoPor;
  final DateTime? fechaRevision;
  final String? notasInternas;
  final DateTime fechaCreacion;

  factory PatientUrgencyClassification.fromJson(Map<String, dynamic> json) {
    return PatientUrgencyClassification(
      idClasificacion: (json['id_clasificacion'] as num?)?.toInt() ?? 0,
      idInteraccion: (json['id_interaccion'] as num?)?.toInt() ?? 0,
      idUsuario: (json['id_usuario'] as num?)?.toInt() ?? 0,
      nivelUrgencia: _parseUrgencyLevel(json['nivel_urgencia'] as String?),
      puntajeRiesgo: (json['puntaje_riesgo'] as num?)?.toInt() ?? 0,
      factoresClinicos: (json['factores_clinicos'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList(),
      criteriosEvaluados: json['criterios_evaluados'] is Map
          ? Map<String, dynamic>.from(json['criterios_evaluados'] as Map)
          : const {},
      recomendacion: json['recomendacion'] as String? ?? '',
      requiereDerivacion: json['requiere_derivacion'] as bool? ?? false,
      estado: _parseClassificationState(json['estado'] as String?),
      revisadoPor: (json['revisado_por'] as num?)?.toInt(),
      fechaRevision: DateTime.tryParse(json['fecha_revision']?.toString() ?? ''),
      notasInternas: json['notas_internas'] as String?,
      fechaCreacion: DateTime.tryParse(json['fecha_creacion']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [
        idClasificacion,
        idInteraccion,
        idUsuario,
        nivelUrgencia,
        puntajeRiesgo,
        factoresClinicos,
        criteriosEvaluados,
        recomendacion,
        requiereDerivacion,
        estado,
        revisadoPor,
        fechaRevision,
        notasInternas,
        fechaCreacion,
      ];
}

class PatientAssistantInteraction extends Equatable {
  const PatientAssistantInteraction({
    required this.idInteraccion,
    required this.idConversacion,
    required this.idUsuario,
    required this.mensaje,
    required this.respuesta,
    required this.intencion,
    required this.estado,
    required this.requiereClasificacionUrgencia,
    required this.nivelPrioridad,
    required this.sintomasDetectados,
    required this.metadata,
    required this.fechaCreacion,
    this.clasificacionUrgencia,
  });

  final int idInteraccion;
  final String idConversacion;
  final int idUsuario;
  final String mensaje;
  final String respuesta;
  final PatientAssistantIntent intencion;
  final PatientAssistantState estado;
  final bool requiereClasificacionUrgencia;
  final PatientUrgencyPriority nivelPrioridad;
  final List<String> sintomasDetectados;
  final Map<String, dynamic> metadata;
  final PatientUrgencyClassification? clasificacionUrgencia;
  final DateTime fechaCreacion;

  factory PatientAssistantInteraction.fromJson(Map<String, dynamic> json) {
    return PatientAssistantInteraction(
      idInteraccion: (json['id_interaccion'] as num?)?.toInt() ?? 0,
      idConversacion: json['id_conversacion'] as String? ?? '',
      idUsuario: (json['id_usuario'] as num?)?.toInt() ?? 0,
      mensaje: json['mensaje'] as String? ?? '',
      respuesta: json['respuesta'] as String? ?? '',
      intencion: _parseIntent(json['intencion'] as String?),
      estado: _parseState(json['estado'] as String?),
      requiereClasificacionUrgencia: json['requiere_clasificacion_urgencia'] as bool? ?? false,
      nivelPrioridad: _parsePriority(json['nivel_prioridad'] as String?),
      sintomasDetectados: (json['sintomas_detectados'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .toList(),
      metadata: json['metadata'] is Map ? Map<String, dynamic>.from(json['metadata'] as Map) : const {},
      clasificacionUrgencia: json['clasificacion_urgencia'] is Map<String, dynamic>
          ? PatientUrgencyClassification.fromJson(
              Map<String, dynamic>.from(json['clasificacion_urgencia'] as Map),
            )
          : null,
      fechaCreacion: DateTime.tryParse(json['fecha_creacion']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [
        idInteraccion,
        idConversacion,
        idUsuario,
        mensaje,
        respuesta,
        intencion,
        estado,
        requiereClasificacionUrgencia,
        nivelPrioridad,
        sintomasDetectados,
        metadata,
        clasificacionUrgencia,
        fechaCreacion,
      ];
}

PatientAssistantIntent _parseIntent(String? value) {
  return PatientAssistantIntent.values.firstWhere(
    (item) => item.name.toUpperCase() == (value ?? '').toUpperCase(),
    orElse: () => PatientAssistantIntent.noComprendida,
  );
}

PatientAssistantState _parseState(String? value) {
  return PatientAssistantState.values.firstWhere(
    (item) => item.name.toUpperCase() == (value ?? '').toUpperCase(),
    orElse: () => PatientAssistantState.noComprendida,
  );
}

PatientUrgencyPriority _parsePriority(String? value) {
  return PatientUrgencyPriority.values.firstWhere(
    (item) => item.name.toUpperCase() == (value ?? '').toUpperCase(),
    orElse: () => PatientUrgencyPriority.noAplica,
  );
}

PatientUrgencyLevel _parseUrgencyLevel(String? value) {
  return PatientUrgencyLevel.values.firstWhere(
    (item) => item.name.toUpperCase() == (value ?? '').toUpperCase(),
    orElse: () => PatientUrgencyLevel.baja,
  );
}

PatientUrgencyClassificationState _parseClassificationState(String? value) {
  return PatientUrgencyClassificationState.values.firstWhere(
    (item) => item.name.toUpperCase() == (value ?? '').toUpperCase(),
    orElse: () => PatientUrgencyClassificationState.pendiente,
  );
}

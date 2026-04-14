class Notificacion {
  const Notificacion({
    required this.id,
    required this.titulo,
    required this.cuerpo,
    required this.tipo,
    required this.leida,
    required this.creadaEn,
  });

  final int id;
  final String titulo;
  final String cuerpo;
  final String tipo;
  final bool leida;
  final DateTime creadaEn;

  factory Notificacion.fromJson(Map<String, dynamic> json) {
    return Notificacion(
      id: json['id'] as int,
      titulo: json['titulo'] as String,
      cuerpo: json['cuerpo'] as String,
      tipo: json['tipo'] as String? ?? 'general',
      leida: json['leida'] as bool? ?? false,
      creadaEn: DateTime.parse(json['creada_en'] as String).toLocal(),
    );
  }

  Notificacion copyWith({bool? leida}) {
    return Notificacion(
      id: id,
      titulo: titulo,
      cuerpo: cuerpo,
      tipo: tipo,
      leida: leida ?? this.leida,
      creadaEn: creadaEn,
    );
  }
}

import 'package:equatable/equatable.dart';

/// Usuario autenticado (payload de `/auth/login/` o `/auth/me/`).
class AuthUser extends Equatable {
  const AuthUser({
    required this.id,
    required this.username,
    required this.email,
    required this.tipoUsuario,
    this.nombres,
    this.apellidos,
    this.nombreCompleto,
  });

  final int id;
  final String username;
  final String email;
  final String tipoUsuario;
  final String? nombres;
  final String? apellidos;
  final String? nombreCompleto;

  String get displayName {
    final full = nombreCompleto?.trim();
    if (full != null && full.isNotEmpty) return full;
    final n = '${nombres ?? ''} ${apellidos ?? ''}'.trim();
    if (n.isNotEmpty) return n;
    return username;
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as int,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      tipoUsuario: json['tipo_usuario'] as String? ?? '',
      nombres: json['nombres'] as String?,
      apellidos: json['apellidos'] as String?,
      nombreCompleto: json['nombre_completo'] as String?,
    );
  }

  @override
  List<Object?> get props =>
      [id, username, email, tipoUsuario, nombres, apellidos, nombreCompleto];
}

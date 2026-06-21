/// Reglas de acceso al asistente virtual (CU23) en móvil.
class IaAccess {
  IaAccess._();

  static const Set<String> _allowedRoles = {
    'ADMIN',
    'ADMINISTRATIVO',
    'MEDICO',
    'ESPECIALISTA',
    'PACIENTE',
  };

  static bool canUseVirtualAssistant(String tipoUsuario) {
    return _allowedRoles.contains(tipoUsuario);
  }

  static bool canUsePatientVirtualAssistant(String tipoUsuario) {
    return tipoUsuario == 'PACIENTE';
  }

  static String deniedMessage() {
    return 'El asistente virtual no está habilitado para tu usuario en esta app.';
  }
}


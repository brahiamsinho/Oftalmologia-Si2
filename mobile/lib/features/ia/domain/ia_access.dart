/// Reglas de acceso al asistente virtual (CU23) en móvil.
class IaAccess {
  IaAccess._();

  static const Set<String> _staffRoles = {
    'ADMIN',
    'ADMINISTRATIVO',
    'MEDICO',
    'ESPECIALISTA',
  };

  static bool canUseVirtualAssistant(String tipoUsuario) {
    return _staffRoles.contains(tipoUsuario);
  }

  static bool canUsePatientVirtualAssistant(String tipoUsuario) {
    return tipoUsuario == 'PACIENTE';
  }

  static String deniedMessage(String tipoUsuario) {
    if (tipoUsuario == 'PACIENTE') {
      return 'No tenés acceso a este asistente. Usá el chatbot de paciente en tu pantalla de inicio.';
    }
    return 'Tu rol no tiene acceso al asistente virtual en esta app.';
  }
}

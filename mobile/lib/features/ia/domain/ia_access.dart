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

  static String deniedMessage(String tipoUsuario) {
    if (tipoUsuario == 'PACIENTE') {
      return 'El asistente virtual está disponible para el personal de la clínica.';
    }
    return 'Tu rol no tiene acceso al asistente virtual en esta app.';
  }
}

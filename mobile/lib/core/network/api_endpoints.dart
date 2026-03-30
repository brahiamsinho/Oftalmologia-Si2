/// Rutas relativas a [AppConfig.apiBaseUrl] (termina en `/`; paths sin `/` inicial, ej. `auth/login/`).
class ApiEndpoints {
  ApiEndpoints._();

  static const String authLogin = 'auth/login/';
  static const String authLogout = 'auth/logout/';
  static const String authMe = 'auth/me/';
  static const String authRegister = 'auth/register/';
  static const String tokenRefresh = 'auth/token/refresh/';
  static const String tokenVerify = 'auth/token/verify/';

  static const String users = 'users/';
  static const String healthCheck = 'health/';
}

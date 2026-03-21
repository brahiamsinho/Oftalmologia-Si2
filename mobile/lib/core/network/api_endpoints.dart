/// Endpoints de la API organizados por módulo.
class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String tokenObtain = '/auth/token/';
  static const String tokenRefresh = '/auth/token/refresh/';
  static const String tokenVerify = '/auth/token/verify/';

  // Users
  static const String users = '/users/';
  static const String userMe = '/users/me/';

  // Patients
  static const String patients = '/patients/';
  static String patient(String id) => '/patients/$id/';

  // Doctors
  static const String doctors = '/doctors/';
  static String doctor(String id) => '/doctors/$id/';

  // Appointments
  static const String appointments = '/appointments/';
  static String appointment(String id) => '/appointments/$id/';

  // Medical Records
  static const String medicalRecords = '/medical-records/';
  static String medicalRecord(String id) => '/medical-records/$id/';

  // Health
  static const String healthCheck = '/health/';
}

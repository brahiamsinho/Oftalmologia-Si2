// Utilidades para respuestas paginadas de Django REST Framework.

int? drfCountFromResponse(dynamic data) {
  if (data is Map<String, dynamic> && data['count'] is int) {
    return data['count'] as int;
  }
  if (data is List<dynamic>) return data.length;
  return null;
}

List<dynamic> drfResultsFromResponse(dynamic data) {
  if (data is List<dynamic>) return data;
  if (data is Map<String, dynamic> && data['results'] is List<dynamic>) {
    return data['results'] as List<dynamic>;
  }
  return const [];
}

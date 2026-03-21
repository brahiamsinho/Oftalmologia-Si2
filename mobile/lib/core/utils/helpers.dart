/// Helpers — Funciones utilitarias compartidas.

/// Formatea una fecha ISO a formato legible.
String formatDate(String isoDate) {
  final date = DateTime.parse(isoDate);
  final months = [
    '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  return '${date.day} ${months[date.month]} ${date.year}';
}

/// Formatea hora de 24h a 12h.
String formatTime(String time24) {
  final parts = time24.split(':');
  final hour = int.parse(parts[0]);
  final minute = parts[1];
  final ampm = hour >= 12 ? 'PM' : 'AM';
  final displayHour = hour % 12 == 0 ? 12 : hour % 12;
  return '$displayHour:$minute $ampm';
}

/// Genera iniciales a partir de un nombre.
String getInitials(String name) {
  return name
      .split(' ')
      .where((word) => word.isNotEmpty)
      .take(2)
      .map((word) => word[0].toUpperCase())
      .join();
}

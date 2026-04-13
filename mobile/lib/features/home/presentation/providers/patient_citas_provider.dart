import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/citas_repository.dart';
import '../../domain/cita_resumen.dart';

final patientCitasProvider =
    AsyncNotifierProvider<PatientCitasNotifier, List<CitaResumen>>(
  PatientCitasNotifier.new,
);

class PatientCitasNotifier extends AsyncNotifier<List<CitaResumen>> {
  @override
  Future<List<CitaResumen>> build() =>
      ref.read(citasRepositoryProvider).listMine();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(citasRepositoryProvider).listMine(),
    );
  }
}

/// Próximas: no canceladas/atendidas y fecha/hora >= hoy (inicio del día local).
List<CitaResumen> upcomingCitas(List<CitaResumen> all) {
  final now = DateTime.now();
  final startToday = DateTime(now.year, now.month, now.day);
  bool isPast(CitaResumen c) {
    final d = DateTime(
      c.fechaHoraInicio.year,
      c.fechaHoraInicio.month,
      c.fechaHoraInicio.day,
    );
    return d.isBefore(startToday);
  }

  bool isClosed(String estado) {
    return estado == 'CANCELADA' ||
        estado == 'ATENDIDA' ||
        estado == 'NO_ASISTIO';
  }

  return all.where((c) => !isClosed(c.estado) && !isPast(c)).toList()
    ..sort((a, b) => a.fechaHoraInicio.compareTo(b.fechaHoraInicio));
}

/// Historial: canceladas, atendidas o fecha anterior a hoy.
List<CitaResumen> historyCitas(List<CitaResumen> all) {
  final now = DateTime.now();
  final startToday = DateTime(now.year, now.month, now.day);
  bool isPast(CitaResumen c) {
    final d = DateTime(
      c.fechaHoraInicio.year,
      c.fechaHoraInicio.month,
      c.fechaHoraInicio.day,
    );
    return d.isBefore(startToday);
  }

  bool isClosed(String estado) {
    return estado == 'CANCELADA' ||
        estado == 'ATENDIDA' ||
        estado == 'NO_ASISTIO';
  }

  return all.where((c) => isClosed(c.estado) || isPast(c)).toList()
    ..sort((a, b) => b.fechaHoraInicio.compareTo(a.fechaHoraInicio));
}

CitaResumen? nextAppointment(List<CitaResumen> all) {
  final up = upcomingCitas(all);
  return up.isEmpty ? null : up.first;
}

/// Tarjeta principal del home: próxima cita si hay; si no, la visita más reciente del historial.
({CitaResumen cita, bool isUpcoming})? heroCita(List<CitaResumen> all) {
  final up = upcomingCitas(all);
  if (up.isNotEmpty) return (cita: up.first, isUpcoming: true);
  final hist = historyCitas(all);
  if (hist.isEmpty) return null;
  return (cita: hist.first, isUpcoming: false);
}

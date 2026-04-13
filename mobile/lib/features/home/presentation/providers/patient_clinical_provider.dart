import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/clinical_repository.dart';
import '../../domain/consulta_resumen.dart';
import '../../domain/estudio_resumen.dart';

final patientConsultasProvider =
    AsyncNotifierProvider<PatientConsultasNotifier, List<ConsultaResumen>>(
  PatientConsultasNotifier.new,
);

class PatientConsultasNotifier extends AsyncNotifier<List<ConsultaResumen>> {
  @override
  Future<List<ConsultaResumen>> build() =>
      ref.read(clinicalRepositoryProvider).listConsultasMine();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(clinicalRepositoryProvider).listConsultasMine(),
    );
  }
}

final patientEstudiosProvider =
    AsyncNotifierProvider<PatientEstudiosNotifier, List<EstudioResumen>>(
  PatientEstudiosNotifier.new,
);

class PatientEstudiosNotifier extends AsyncNotifier<List<EstudioResumen>> {
  @override
  Future<List<EstudioResumen>> build() =>
      ref.read(clinicalRepositoryProvider).listEstudiosMine();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(clinicalRepositoryProvider).listEstudiosMine(),
    );
  }
}

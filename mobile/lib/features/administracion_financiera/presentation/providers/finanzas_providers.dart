import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/seguros_repository.dart';
import '../../data/descuentos_repository.dart';
import '../../data/facturacion_repository.dart';
import '../../domain/seguro_cobertura.dart';
import '../../domain/descuento_beneficio.dart';
import '../../domain/factura_resumen.dart';

// ── Seguros ────────────────────────────────────────────────────────────────

final misAfiliacionesProvider =
    AsyncNotifierProvider<MisAfiliacionesNotifier, List<AfiliacionSeguro>>(
  MisAfiliacionesNotifier.new,
);

class MisAfiliacionesNotifier extends AsyncNotifier<List<AfiliacionSeguro>> {
  @override
  Future<List<AfiliacionSeguro>> build() =>
      ref.read(segurosRepositoryProvider).fetchMisAfiliaciones();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(segurosRepositoryProvider).fetchMisAfiliaciones(),
    );
  }
}

// ── Descuentos ─────────────────────────────────────────────────────────────

final misBeneficiosProvider =
    AsyncNotifierProvider<MisBeneficiosNotifier, List<BeneficioPaciente>>(
  MisBeneficiosNotifier.new,
);

class MisBeneficiosNotifier extends AsyncNotifier<List<BeneficioPaciente>> {
  @override
  Future<List<BeneficioPaciente>> build() =>
      ref.read(descuentosRepositoryProvider).fetchMisBeneficios();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(descuentosRepositoryProvider).fetchMisBeneficios(),
    );
  }
}

// ── Facturación ────────────────────────────────────────────────────────────

final misFacturasProvider =
    AsyncNotifierProvider<MisFacturasNotifier, List<FacturaResumen>>(
  MisFacturasNotifier.new,
);

class MisFacturasNotifier extends AsyncNotifier<List<FacturaResumen>> {
  @override
  Future<List<FacturaResumen>> build() =>
      ref.read(facturacionRepositoryProvider).fetchMisFacturas();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(facturacionRepositoryProvider).fetchMisFacturas(),
    );
  }

  Future<void> filtrar(String? estado) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(facturacionRepositoryProvider).fetchMisFacturas(estado: estado),
    );
  }
}

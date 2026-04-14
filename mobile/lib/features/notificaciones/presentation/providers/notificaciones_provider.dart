import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/notificaciones_repository.dart';
import '../../domain/notificacion.dart';

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

class NotificacionesState {
  const NotificacionesState({
    this.items = const [],
    this.noLeidas = 0,
    this.isLoading = false,
    this.error,
  });

  final List<Notificacion> items;
  final int noLeidas;
  final bool isLoading;
  final String? error;

  NotificacionesState copyWith({
    List<Notificacion>? items,
    int? noLeidas,
    bool? isLoading,
    String? error,
  }) {
    return NotificacionesState(
      items: items ?? this.items,
      noLeidas: noLeidas ?? this.noLeidas,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class NotificacionesNotifier extends StateNotifier<NotificacionesState> {
  NotificacionesNotifier(this._repo) : super(const NotificacionesState());

  final NotificacionesRepository _repo;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.fetchMias();
      state = state.copyWith(
        items: result.items,
        noLeidas: result.noLeidas,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> marcarLeida(int id) async {
    try {
      final updated = await _repo.marcarLeida(id);
      final newItems = state.items
          .map((n) => n.id == id ? updated : n)
          .toList();
      final noLeidas = newItems.where((n) => !n.leida).length;
      state = state.copyWith(items: newItems, noLeidas: noLeidas);
    } catch (_) {
      // Fallo silencioso — la marca de lectura no es crítica.
    }
  }

  Future<void> marcarTodasLeidas() async {
    try {
      await _repo.marcarTodasLeidas();
      final newItems = state.items.map((n) => n.copyWith(leida: true)).toList();
      state = state.copyWith(items: newItems, noLeidas: 0);
    } catch (_) {}
  }
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final notificacionesProvider =
    StateNotifierProvider<NotificacionesNotifier, NotificacionesState>((ref) {
  final repo = ref.watch(notificacionesRepositoryProvider);
  return NotificacionesNotifier(repo);
});

/// Conveniencia: solo el número de no leídas para mostrar en el badge.
final noLeidasProvider = Provider<int>((ref) {
  return ref.watch(notificacionesProvider).noLeidas;
});

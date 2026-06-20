import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/patient_assistant_repository.dart';
import '../../domain/patient_assistant_models.dart';

class PatientVirtualAssistantState {
  const PatientVirtualAssistantState({
    this.conversationId = '',
    this.interactions = const [],
    this.loading = false,
    this.historyLoading = false,
    this.error,
  });

  final String conversationId;
  final List<PatientAssistantInteraction> interactions;
  final bool loading;
  final bool historyLoading;
  final String? error;

  PatientVirtualAssistantState copyWith({
    String? conversationId,
    List<PatientAssistantInteraction>? interactions,
    bool? loading,
    bool? historyLoading,
    String? error,
    bool clearError = false,
  }) {
    return PatientVirtualAssistantState(
      conversationId: conversationId ?? this.conversationId,
      interactions: interactions ?? this.interactions,
      loading: loading ?? this.loading,
      historyLoading: historyLoading ?? this.historyLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final patientVirtualAssistantProvider =
    NotifierProvider<PatientVirtualAssistantNotifier, PatientVirtualAssistantState>(
  PatientVirtualAssistantNotifier.new,
);

class PatientVirtualAssistantNotifier extends Notifier<PatientVirtualAssistantState> {
  final _random = Random();

  @override
  PatientVirtualAssistantState build() {
    return PatientVirtualAssistantState(conversationId: _newConversationId());
  }

  String _newConversationId() {
    final bytes = List<int>.generate(16, (_) => _random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    String hex(int value) => value.toRadixString(16).padLeft(2, '0');

    final b = bytes.map(hex).toList();
    return '${b[0]}${b[1]}${b[2]}${b[3]}-${b[4]}${b[5]}-${b[6]}${b[7]}-${b[8]}${b[9]}-${b[10]}${b[11]}${b[12]}${b[13]}${b[14]}${b[15]}';
  }

  void resetConversation() {
    state = PatientVirtualAssistantState(conversationId: _newConversationId());
  }

  Future<void> loadHistory() async {
    if (state.conversationId.isEmpty || state.historyLoading) return;
    state = state.copyWith(historyLoading: true, clearError: true);
    try {
      final history = await ref.read(patientAssistantRepositoryProvider).getHistory(
            conversationId: state.conversationId,
          );
      state = state.copyWith(interactions: history, historyLoading: false);
    } catch (e) {
      state = state.copyWith(
        historyLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.loading) return;

    final optimistic = PatientAssistantInteraction(
      idInteraccion: -1,
      idConversacion: state.conversationId,
      idUsuario: 0,
      mensaje: trimmed,
      respuesta: '',
      intencion: PatientAssistantIntent.noComprendida,
      estado: PatientAssistantState.noComprendida,
      requiereClasificacionUrgencia: false,
      nivelPrioridad: PatientUrgencyPriority.noAplica,
      sintomasDetectados: const [],
      metadata: const {},
      fechaCreacion: DateTime.now(),
    );

    state = state.copyWith(
      interactions: [...state.interactions, optimistic],
      loading: true,
      clearError: true,
    );

    try {
      final response = await ref.read(patientAssistantRepositoryProvider).postMessage(
            message: trimmed,
            conversationId: state.conversationId,
          );

      final updated = [...state.interactions];
      updated.removeWhere((item) => item.idInteraccion == -1);
      updated.add(response);

      state = state.copyWith(
        interactions: updated,
        loading: false,
      );
    } catch (e) {
      final updated = [...state.interactions];
      updated.removeWhere((item) => item.idInteraccion == -1);
      state = state.copyWith(
        interactions: updated,
        loading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }
}

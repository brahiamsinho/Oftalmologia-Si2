import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/chatbot_repository.dart';
import '../../domain/chatbot_models.dart';

class VirtualAssistantState {
  const VirtualAssistantState({
    this.messages = const [],
    this.loading = false,
    this.error,
    this.model,
  });

  final List<VirtualChatMessage> messages;
  final bool loading;
  final String? error;
  final String? model;

  VirtualAssistantState copyWith({
    List<VirtualChatMessage>? messages,
    bool? loading,
    String? error,
    bool clearError = false,
    String? model,
    bool clearModel = false,
  }) {
    return VirtualAssistantState(
      messages: messages ?? this.messages,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      model: clearModel ? null : (model ?? this.model),
    );
  }
}

final virtualAssistantProvider =
    NotifierProvider<VirtualAssistantNotifier, VirtualAssistantState>(
  VirtualAssistantNotifier.new,
);

class VirtualAssistantNotifier extends Notifier<VirtualAssistantState> {
  int _seq = 0;

  @override
  VirtualAssistantState build() => const VirtualAssistantState();

  String _id(String prefix) {
    _seq += 1;
    return '$prefix$_seq';
  }

  void clearConversation() {
    _seq = 0;
    state = const VirtualAssistantState();
  }

  Future<void> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.loading) return;

    final userMsg = VirtualChatMessage(
      id: _id('u'),
      role: ChatRole.user,
      content: trimmed,
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, userMsg],
      loading: true,
      clearError: true,
    );

    try {
      final history = state.messages
          .where((m) => !m.isError)
          .map(
            (m) => ChatHistoryItem(role: m.role, content: m.content),
          )
          .toList();

      final response = await ref.read(chatbotRepositoryProvider).postMessage(
            message: trimmed,
            history: history,
          );

      final assistantMsg = VirtualChatMessage(
        id: _id('a'),
        role: ChatRole.assistant,
        content: response.reply,
        createdAt: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, assistantMsg],
        loading: false,
        model: response.model,
      );
    } catch (e) {
      final errText = e.toString().replaceFirst('Exception: ', '');
      state = state.copyWith(
        loading: false,
        error: errText,
      );
    }
  }
}

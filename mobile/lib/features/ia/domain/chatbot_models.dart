import 'package:equatable/equatable.dart';

enum ChatRole { user, assistant }

class ChatHistoryItem extends Equatable {
  const ChatHistoryItem({required this.role, required this.content});

  final ChatRole role;
  final String content;

  Map<String, dynamic> toJson() => {
        'role': role == ChatRole.user ? 'user' : 'assistant',
        'content': content,
      };

  @override
  List<Object?> get props => [role, content];
}

class ChatbotResponse extends Equatable {
  const ChatbotResponse({required this.reply, required this.model});

  final String reply;
  final String model;

  factory ChatbotResponse.fromJson(Map<String, dynamic> json) {
    return ChatbotResponse(
      reply: json['reply'] as String? ?? '',
      model: json['model'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [reply, model];
}

class VirtualChatMessage extends Equatable {
  const VirtualChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
    this.isError = false,
  });

  final String id;
  final ChatRole role;
  final String content;
  final DateTime createdAt;
  final bool isError;

  bool get isUser => role == ChatRole.user;

  @override
  List<Object?> get props => [id, role, content, createdAt, isError];
}

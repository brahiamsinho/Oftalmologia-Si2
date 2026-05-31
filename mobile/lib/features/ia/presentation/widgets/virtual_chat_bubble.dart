import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../../domain/chatbot_models.dart';

class VirtualChatBubble extends StatelessWidget {
  const VirtualChatBubble({super.key, required this.message});

  final VirtualChatMessage message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUser = message.isUser;
    final time = DateFormat('HH:mm').format(message.createdAt.toLocal());

    if (isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.sizeOf(context).width * 0.82,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                margin: const EdgeInsets.only(left: 48, bottom: 4),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  color: AppTheme.primaryColor,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(18),
                    topRight: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                    bottomRight: Radius.circular(4),
                  ),
                ),
                child: Text(
                  message.content,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white,
                    height: 1.35,
                  ),
                ),
              ),
              Text(time, style: theme.textTheme.labelSmall?.copyWith(color: AppTheme.textMuted)),
              const SizedBox(height: 8),
            ],
          ),
        ),
      );
    }

    final isError = message.isError;
    return Align(
      alignment: Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.9,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(right: 32, bottom: 4),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isError ? const Color(0xFFFEF2F2) : Colors.white,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(18),
                  bottomLeft: Radius.circular(18),
                  bottomRight: Radius.circular(18),
                ),
                border: Border.all(
                  color: isError ? const Color(0xFFFECACA) : const Color(0xFFE5E7EB),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        isError ? Icons.error_outline_rounded : Icons.smart_toy_outlined,
                        size: 18,
                        color: isError ? AppTheme.errorColor : AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isError ? 'Error' : 'Asistente',
                        style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    message.content,
                    style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                  ),
                ],
              ),
            ),
            Text(time, style: theme.textTheme.labelSmall?.copyWith(color: AppTheme.textMuted)),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

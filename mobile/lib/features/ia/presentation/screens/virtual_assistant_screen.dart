import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../config/app_config.dart';
import '../../../../config/theme.dart';
import '../../../../core/ui/widgets/app_async_states.dart';
import '../../../auth/presentation/providers/session_notifier.dart';
import '../../domain/ia_access.dart';
import '../providers/virtual_assistant_provider.dart';
import '../widgets/virtual_chat_bubble.dart';

/// Asistente virtual conversacional (CU23) — `POST ia/chatbot/`.
class VirtualAssistantScreen extends ConsumerStatefulWidget {
  const VirtualAssistantScreen({super.key});

  @override
  ConsumerState<VirtualAssistantScreen> createState() => _VirtualAssistantScreenState();
}

class _VirtualAssistantScreenState extends ConsumerState<VirtualAssistantScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  static const _suggestions = [
    '¿Cómo priorizo urgencias oftalmológicas de hoy?',
    '¿Qué datos necesito antes de una cirugía de cataratas?',
    '¿Cómo explico un copago con seguro al paciente?',
  ];

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: AppTheme.motionNormal,
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    await ref.read(virtualAssistantProvider.notifier).sendMessage(text);
    _scrollToEnd();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(sessionNotifierProvider);
    final theme = Theme.of(context);

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!IaAccess.canUseVirtualAssistant(user.tipoUsuario)) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        appBar: AppBar(title: const Text('Asistente virtual')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: AppEmptyStateCard(
              icon: Icons.lock_outline_rounded,
              title: 'Acceso restringido',
              subtitle: IaAccess.deniedMessage(user.tipoUsuario),
              centered: true,
            ),
          ),
        ),
      );
    }

    final state = ref.watch(virtualAssistantProvider);
    ref.listen(virtualAssistantProvider, (prev, next) {
      if (next.messages.length != (prev?.messages.length ?? 0)) {
        _scrollToEnd();
      }
    });

    final slug = AppConfig.tenantSlug.trim();
    final tenantLabel = slug.isNotEmpty ? slug : 'clínica';

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Asistente virtual',
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            Text(
              tenantLabel,
              style: theme.textTheme.labelSmall?.copyWith(color: AppTheme.textMuted),
            ),
          ],
        ),
        actions: [
          if (state.messages.isNotEmpty)
            IconButton(
              tooltip: 'Limpiar chat',
              onPressed: state.loading
                  ? null
                  : () => ref.read(virtualAssistantProvider.notifier).clearConversation(),
              icon: const Icon(Icons.delete_outline_rounded),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              children: [
                if (state.messages.isEmpty)
                  AppFadeSlideIn(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Apoyo clínico y administrativo',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Consultá sobre agenda, pacientes, seguros, reportes y flujos '
                            'de $tenantLabel. No reemplaza el criterio médico.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppTheme.textMuted,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 12),
                          ..._suggestions.map(
                            (s) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: ActionChip(
                                label: Text(s),
                                onPressed: state.loading
                                    ? null
                                    : () {
                                        _controller.text = s;
                                        _send();
                                      },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ...state.messages.map((m) => VirtualChatBubble(message: m)),
                if (state.loading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text('El asistente está pensando…'),
                      ],
                    ),
                  ),
                if (state.error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: AppErrorStateCard(
                      message: state.error!,
                      onRetry: () {
                        final last = state.messages.where((m) => m.isUser).lastOrNull;
                        if (last != null) {
                          ref
                              .read(virtualAssistantProvider.notifier)
                              .sendMessage(last.content);
                        }
                      },
                    ),
                  ),
                const SizedBox(height: 72),
              ],
            ),
          ),
          _InputBar(
            controller: _controller,
            busy: state.loading,
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  const _InputBar({
    required this.controller,
    required this.busy,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool busy;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 8,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  minLines: 1,
                  maxLines: 4,
                  enabled: !busy,
                  textInputAction: TextInputAction.send,
                  onSubmitted: busy ? null : (_) => onSend(),
                  decoration: const InputDecoration(
                    hintText: 'Escribí tu consulta…',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: busy ? null : onSend,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(52, 52),
                  padding: EdgeInsets.zero,
                  shape: const CircleBorder(),
                ),
                child: busy
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

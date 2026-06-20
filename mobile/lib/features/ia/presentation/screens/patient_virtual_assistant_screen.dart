import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../config/app_config.dart';
import '../../../../config/theme.dart';
import '../../../../core/ui/widgets/app_async_states.dart';
import '../../../auth/presentation/providers/session_notifier.dart';
import '../../domain/chatbot_models.dart';
import '../../domain/ia_access.dart';
import '../../domain/patient_assistant_models.dart';
import '../providers/patient_virtual_assistant_provider.dart';
import '../widgets/virtual_chat_bubble.dart';

class PatientVirtualAssistantScreen extends ConsumerStatefulWidget {
  const PatientVirtualAssistantScreen({super.key});

  @override
  ConsumerState<PatientVirtualAssistantScreen> createState() => _PatientVirtualAssistantScreenState();
}

class _PatientVirtualAssistantScreenState extends ConsumerState<PatientVirtualAssistantScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _historyRequested = false;

  static const _suggestions = [
    'Tengo dolor ocular intenso y veo borroso.',
    '¿Qué debo hacer antes de mi cirugía de cataratas?',
    '¿Cuándo debo ir a la clínica por un problema de visión?'
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
    await ref.read(patientVirtualAssistantProvider.notifier).sendMessage(text);
    _scrollToEnd();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(sessionNotifierProvider);
    final theme = Theme.of(context);

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!IaAccess.canUsePatientVirtualAssistant(user.tipoUsuario)) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        appBar: AppBar(title: const Text('Asistente virtual')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: AppEmptyStateCard(
              icon: Icons.lock_outline_rounded,
              title: 'Acceso restringido',
              subtitle: 'Esta pantalla es para pacientes.',
              centered: true,
            ),
          ),
        ),
      );
    }

    final state = ref.watch(patientVirtualAssistantProvider);
    ref.listen(patientVirtualAssistantProvider, (prev, next) {
      if (next.interactions.length != (prev?.interactions.length ?? 0)) {
        _scrollToEnd();
      }
    });

    if (!_historyRequested) {
      _historyRequested = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref.read(patientVirtualAssistantProvider.notifier).loadHistory();
        }
      });
    }

    final slug = AppConfig.tenantSlug.trim();
    final tenantLabel = slug.isNotEmpty ? slug : 'clínica';

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Asistente virtual para pacientes',
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            Text(
              tenantLabel,
              style: theme.textTheme.labelSmall?.copyWith(color: AppTheme.textMuted),
            ),
          ],
        ),
        actions: [
          if (state.interactions.isNotEmpty)
            IconButton(
              tooltip: 'Limpiar chat',
              onPressed: state.loading
                  ? null
                  : () => ref.read(patientVirtualAssistantProvider.notifier).resetConversation(),
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
                if (state.interactions.isEmpty)
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
                            'Orientación para tu atención',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Te ayudamos con citas, procedimientos, postoperatorio y señales de alarma. '
                            'Si detectamos urgencia, se marca para valoración clínica.',
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
                if (state.historyLoading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                ...state.interactions.map((item) => _InteractionThread(interaction: item)),
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
                        final last = state.interactions.isNotEmpty ? state.interactions.last : null;
                        if (last != null) {
                          ref.read(patientVirtualAssistantProvider.notifier).sendMessage(last.mensaje);
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

class _InteractionThread extends StatelessWidget {
  const _InteractionThread({required this.interaction});

  final PatientAssistantInteraction interaction;

  @override
  Widget build(BuildContext context) {
    final userBubble = VirtualChatMessage(
      id: 'u-${interaction.idInteraccion}',
      role: ChatRole.user,
      content: interaction.mensaje,
      createdAt: interaction.fechaCreacion,
    );
    final assistantBubble = VirtualChatMessage(
      id: 'a-${interaction.idInteraccion}',
      role: ChatRole.assistant,
      content: interaction.respuesta,
      createdAt: interaction.fechaCreacion,
    );

    final classification = interaction.clasificacionUrgencia;

    return Column(
      children: [
        VirtualChatBubble(message: userBubble),
        VirtualChatBubble(message: assistantBubble),
        if (classification != null)
          Padding(
            padding: const EdgeInsets.only(left: 12, right: 12, bottom: 12),
            child: _UrgencyBanner(classification: classification),
          ),
      ],
    );
  }
}

class _UrgencyBanner extends StatelessWidget {
  const _UrgencyBanner({required this.classification});

  final PatientUrgencyClassification classification;

  @override
  Widget build(BuildContext context) {
    final level = classification.nivelUrgencia.name.toUpperCase();
    final levelColor = switch (classification.nivelUrgencia) {
      PatientUrgencyLevel.critica => const Color(0xFFB91C1C),
      PatientUrgencyLevel.alta => const Color(0xFFEA580C),
      PatientUrgencyLevel.media => const Color(0xFFD97706),
      PatientUrgencyLevel.baja => const Color(0xFF0F766E),
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: levelColor.withValues(alpha: 0.25)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.shield_outlined, color: levelColor, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                   'Urgencia ${level.toLowerCase()} (${classification.puntajeRiesgo}/100)',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: levelColor,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            classification.recomendacion,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.35),
          ),
          if (classification.requiereDerivacion) ...[
            const SizedBox(height: 8),
            Text(
              'Requiere derivación humana prioritaria.',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: levelColor,
                  ),
            ),
          ],
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

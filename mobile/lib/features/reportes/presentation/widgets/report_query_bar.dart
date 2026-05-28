import 'package:flutter/material.dart';

import '../../../../config/theme.dart';

class ReportQueryBar extends StatelessWidget {
  const ReportQueryBar({
    super.key,
    required this.controller,
    required this.isListening,
    required this.loading,
    required this.onToggleListen,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool isListening;
  final bool loading;
  final VoidCallback onToggleListen;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 1,
      shadowColor: Colors.black12,
      borderRadius: BorderRadius.circular(28),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 8, 4),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                enabled: !loading,
                minLines: 1,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Ej: Pacientes ACTIVO en excel y pdf',
                  border: InputBorder.none,
                ),
                onSubmitted: (_) {
                  if (!loading) onSubmit();
                },
              ),
            ),
            IconButton(
              onPressed: loading ? null : onToggleListen,
              tooltip: 'Dictar por voz',
              icon: Icon(
                isListening ? Icons.mic : Icons.mic_none_outlined,
                color: isListening ? Colors.red : Colors.grey.shade600,
              ),
            ),
            const SizedBox(width: 4),
            FilledButton.icon(
              onPressed: loading || controller.text.trim().isEmpty ? null : onSubmit,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              icon: loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.auto_awesome, size: 18),
              label: const Text('Generar'),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../config/app_config.dart';

Future<void> launchClinicPhone(BuildContext context) async {
  final raw = AppConfig.clinicPhone;
  if (raw == null || raw.trim().isEmpty) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Configurá CLINIC_PHONE en mobile/.env o contactá a la clínica por otros medios.',
        ),
      ),
    );
    return;
  }
  final path = raw.replaceAll(RegExp(r'\s'), '');
  final uri = Uri(scheme: 'tel', path: path);
  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No se pudo abrir el marcador.')),
    );
  }
}

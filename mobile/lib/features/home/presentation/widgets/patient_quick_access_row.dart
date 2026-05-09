import 'package:flutter/material.dart';

import '../../../../config/theme.dart';
import '../screens/patient_clinical_screen.dart';
import '../utils/launch_clinic_phone.dart';

class PatientQuickAccessRow extends StatelessWidget {
  const PatientQuickAccessRow({
    super.key,
    required this.onMisCitas,
  });

  final VoidCallback onMisCitas;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: EdgeInsets.fromLTRB(AppTheme.space5, AppTheme.space2, AppTheme.space5, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Accesos rápidos',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
            ),
          ),
          SizedBox(height: AppTheme.space3),
          Row(
            children: [
              Expanded(
                child: Semantics(
                  label: 'Acceso rápido: Mis citas. Ver todas tus citas programadas.',
                  button: true,
                  child: _QuickTile(
                    icon: Icons.calendar_month_rounded,
                    iconColor: AppTheme.primaryColor,
                    title: 'Mis citas',
                    subtitle: 'Ver todas',
                    onTap: onMisCitas,
                  ),
                ),
              ),
              SizedBox(width: AppTheme.space2),
              Expanded(
                child: Semantics(
                  label: 'Acceso rápido: Historial clínico. Consultas y estudios.',
                  button: true,
                  child: _QuickTile(
                    icon: Icons.description_outlined,
                    iconColor: const Color(0xFF0D9488),
                    title: 'Historial',
                    subtitle: 'Consultas · estudios',
                    onTap: () {
                      Navigator.of(context).push<void>(
                        MaterialPageRoute<void>(
                          builder: (_) => const PatientClinicalScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ),
              SizedBox(width: AppTheme.space2),
              Expanded(
                child: Semantics(
                  label: 'Acceso rápido: Contacto de emergencias con la clínica.',
                  button: true,
                  child: _QuickTile(
                    icon: Icons.phone_in_talk_rounded,
                    iconColor: const Color(0xFFDC2626),
                    title: 'Contacto',
                    subtitle: 'Emergencias',
                    onTap: () => launchClinicPhone(context),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      elevation: 0,
      shadowColor: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Ink(
            padding: EdgeInsets.symmetric(vertical: AppTheme.space3, horizontal: AppTheme.space2),
            decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5E7EB)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A0F172A),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Icon(icon, color: iconColor, size: 26),
              SizedBox(height: AppTheme.space2),
              Text(
                title,
                textAlign: TextAlign.center,
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
              Text(
                subtitle,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }
}

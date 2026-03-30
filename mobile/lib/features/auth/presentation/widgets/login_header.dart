import 'package:flutter/material.dart';

import '../../../../config/theme.dart';

/// Cabecera del login: logo, nombre de clínica, título y subtítulo.
class LoginHeader extends StatelessWidget {
  const LoginHeader({super.key});

  static const Color _logoSurface = Color(0xFFDBEAFE);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: _logoSurface,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryColor.withValues(alpha: 0.22),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Center(
            child: SizedBox(
              width: 40,
              height: 40,
              child: CustomPaint(painter: _EyeLogoPainter()),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'CLÍNICA OFTALMOLÓGICA',
          textAlign: TextAlign.center,
          style: theme.textTheme.labelLarge?.copyWith(
            color: AppTheme.secondaryColor,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.6,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Iniciar sesión',
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineSmall?.copyWith(
            color: AppTheme.secondaryColor,
            fontWeight: FontWeight.w800,
            fontSize: 26,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Accede a tu portal de paciente de forma segura',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: AppTheme.textMuted,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

/// Ojo estilizado (iris, pupila, highlight) para el logo.
class _EyeLogoPainter extends CustomPainter {
  const _EyeLogoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final irisR = size.width * 0.38;

    final iris = Paint()..color = AppTheme.primaryDark;
    canvas.drawCircle(Offset(cx, cy), irisR, iris);

    final pupil = Paint()..color = const Color(0xFF0F172A);
    canvas.drawCircle(Offset(cx, cy), irisR * 0.45, pupil);

    final highlight = Paint()..color = Colors.white.withValues(alpha: 0.92);
    canvas.drawCircle(
      Offset(cx - irisR * 0.35, cy - irisR * 0.35),
      irisR * 0.16,
      highlight,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

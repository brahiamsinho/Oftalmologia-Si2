import 'package:flutter/material.dart';

import '../../../../config/theme.dart';

/// Acciones secundarias bajo la tarjeta: registro, términos y privacidad.
class LoginActions extends StatelessWidget {
  const LoginActions({
    super.key,
    required this.onCreateAccount,
    this.onTerms,
    this.onPrivacy,
  });

  final VoidCallback onCreateAccount;
  final VoidCallback? onTerms;
  final VoidCallback? onPrivacy;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final baseStyle = theme.textTheme.bodySmall?.copyWith(
      color: AppTheme.textMuted,
      height: 1.45,
      fontSize: 12,
    );
    final linkStyle = theme.textTheme.bodySmall?.copyWith(
      color: AppTheme.primaryColor,
      fontWeight: FontWeight.w600,
      fontSize: 12,
    );

    return Column(
      children: [
        Text(
          '¿No tienes cuenta?',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: AppTheme.textMuted,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: onCreateAccount,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primaryColor,
              side: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Text(
              'Crear cuenta',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text('Al continuar aceptas nuestros ', style: baseStyle),
            GestureDetector(
              onTap: onTerms,
              child: Text('Términos de servicio', style: linkStyle),
            ),
            Text(' y ', style: baseStyle),
            GestureDetector(
              onTap: onPrivacy,
              child: Text('Política de privacidad', style: linkStyle),
            ),
            Text('.', style: baseStyle),
          ],
        ),
      ],
    );
  }
}

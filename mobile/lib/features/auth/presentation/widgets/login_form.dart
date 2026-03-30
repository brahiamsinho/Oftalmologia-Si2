import 'package:flutter/material.dart';

import '../../../../config/theme.dart';

/// Tarjeta con aviso de seguridad, campos, error, olvidé contraseña y botón principal.
class LoginForm extends StatefulWidget {
  const LoginForm({
    super.key,
    required this.emailController,
    required this.passwordController,
    required this.onSubmit,
    this.errorMessage,
    this.isLoading = false,
    this.onForgotPassword,
  });

  final TextEditingController emailController;
  final TextEditingController passwordController;
  final VoidCallback onSubmit;
  final String? errorMessage;
  final bool isLoading;
  final VoidCallback? onForgotPassword;

  static const Color _bannerBg = Color(0xFFE0F2FE);
  static const Color _bannerFg = Color(0xFF0369A1);

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SecureBanner(
            background: LoginForm._bannerBg,
            foreground: LoginForm._bannerFg,
            theme: theme,
          ),
          const SizedBox(height: 20),
          if (widget.errorMessage != null) ...[
            _InlineError(message: widget.errorMessage!),
            const SizedBox(height: 16),
          ],
          _LabeledField(
            label: 'Correo electrónico',
            child: TextField(
              controller: widget.emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autocorrect: false,
              decoration: const InputDecoration(
                hintText: 'correo@ejemplo.com',
                prefixIcon: Icon(
                  Icons.mail_outline_rounded,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _LabeledField(
            label: 'Contraseña',
            child: TextField(
              controller: widget.passwordController,
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) {
                if (!widget.isLoading) widget.onSubmit();
              },
              decoration: InputDecoration(
                hintText: '••••••••',
                prefixIcon: const Icon(
                  Icons.lock_outline_rounded,
                  color: Color(0xFF9CA3AF),
                ),
                suffixIcon: IconButton(
                  onPressed: () {
                    setState(() => _obscurePassword = !_obscurePassword);
                  },
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: const Color(0xFF9CA3AF),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: widget.isLoading ? null : widget.onForgotPassword,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                foregroundColor: AppTheme.primaryColor,
              ),
              child: const Text('¿Olvidaste tu contraseña?'),
            ),
          ),
          const SizedBox(height: 12),
          _GradientPrimaryButton(
            label: 'Ingresar',
            isLoading: widget.isLoading,
            onPressed: widget.onSubmit,
          ),
        ],
      ),
    );
  }
}

class _SecureBanner extends StatelessWidget {
  const _SecureBanner({
    required this.background,
    required this.foreground,
    required this.theme,
  });

  final Color background;
  final Color foreground;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.shield_outlined, size: 20, color: foreground),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Conexión segura · Solo para pacientes registrados',
              style: theme.textTheme.bodySmall?.copyWith(
                color: foreground,
                fontWeight: FontWeight.w600,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.errorColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.errorColor.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: AppTheme.errorColor,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppTheme.errorColor,
                height: 1.35,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  const _LabeledField({
    required this.label,
    required this.child,
  });

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: const Color(0xFF374151),
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _GradientPrimaryButton extends StatelessWidget {
  const _GradientPrimaryButton({
    required this.label,
    required this.isLoading,
    required this.onPressed,
  });

  final String label;
  final bool isLoading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          child: Ink(
            height: 52,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFF2563EB),
                  Color(0xFF1D4ED8),
                ],
              ),
            ),
            child: Center(
              child: isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      label,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

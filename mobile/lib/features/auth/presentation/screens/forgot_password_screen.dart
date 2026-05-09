import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../config/theme.dart';
import '../../data/auth_repository.dart';

/// Pantalla para solicitar recuperación de contraseña.
/// El usuario ingresa su email y el backend envía un token por correo (Mailhog en dev).
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _repo = AuthRepository();

  bool _isLoading = false;
  String? _errorMessage;
  bool _success = false;

  static final _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();

    if (email.isEmpty) {
      setState(() => _errorMessage = 'Ingresá tu correo electrónico.');
      return;
    }
    if (!_emailRegex.hasMatch(email)) {
      setState(() => _errorMessage = 'Correo electrónico no válido.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _repo.requestPasswordReset(email);
      if (!mounted) return;
      setState(() => _success = true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'No se pudo enviar la solicitud.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recuperar contraseña'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFEFF6FF), Color(0xFFF8FAFC)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(AppTheme.space6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  label: 'Icono de recuperación de contraseña',
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      color: Color(0xFFDBEAFE),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.lock_reset_rounded,
                      color: Color(0xFF2563EB),
                      size: 36,
                    ),
                  ),
                ),
                SizedBox(height: AppTheme.space5),
                Text(
                  '¿Olvidaste tu contraseña?',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: AppTheme.space3),
                Text(
                  'Ingresá tu correo electrónico y te enviaremos un código para restablecer tu contraseña.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
                SizedBox(height: AppTheme.space6),
                if (_success) ...[
                  Container(
                    padding: EdgeInsets.all(AppTheme.space4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF6EE7B7)),
                    ),
                    child: Column(
                      children: [
                        Semantics(
                          label: 'Correo enviado exitosamente',
                          child: const Icon(
                            Icons.check_circle_outline,
                            color: Color(0xFF059669),
                            size: 48,
                          ),
                        ),
                        SizedBox(height: AppTheme.space3),
                        Text(
                          'Instrucciones enviadas',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF047857),
                          ),
                        ),
                        SizedBox(height: AppTheme.space2),
                        Text(
                          'Revisá tu bandeja de entrada (y spam). En desarrollo, el correo llega a Mailhog.',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF047857),
                            height: 1.4,
                          ),
                        ),
                        SizedBox(height: AppTheme.space4),
                        Semantics(
                          label: 'Botón para ir a restablecer contraseña con el código recibido',
                          button: true,
                          child: SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: () => context.push('/reset-password'),
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF059669),
                                minimumSize: const Size(double.infinity, 48),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: const Text('Restablecer contraseña'),
                            ),
                          ),
                        ),
                        SizedBox(height: AppTheme.space3),
                        TextButton(
                          onPressed: () => context.pop(),
                          child: const Text('Volver al inicio de sesión'),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  Semantics(
                    label: 'Campo de correo electrónico para recuperación',
                    child: TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Correo electrónico',
                        hintText: 'tu@correo.com',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                  ),
                  SizedBox(height: AppTheme.space4),
                  if (_errorMessage != null)
                    Container(
                      padding: EdgeInsets.all(AppTheme.space3),
                      margin: EdgeInsets.only(bottom: AppTheme.space4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: const Color(0xFFB91C1C),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  SizedBox(height: AppTheme.space4),
                  Semantics(
                    label: 'Botón para enviar instrucciones de recuperación',
                    button: true,
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _isLoading ? null : _submit,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(double.infinity, 48),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Enviar instrucciones'),
                      ),
                    ),
                  ),
                  SizedBox(height: AppTheme.space4),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: const Text('Volver al inicio de sesión'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

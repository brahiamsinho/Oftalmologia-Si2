import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../config/theme.dart';
import '../../data/auth_repository.dart';

/// Pantalla para restablecer contraseña usando el token recibido por email.
/// En desarrollo, el token se obtiene del email en Mailhog.
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _repo = AuthRepository();

  bool _isLoading = false;
  String? _errorMessage;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _success = false;

  @override
  void dispose() {
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final token = _tokenController.text.trim();
    final p1 = _passwordController.text;
    final p2 = _confirmPasswordController.text;

    if (token.isEmpty || p1.isEmpty || p2.isEmpty) {
      setState(() => _errorMessage = 'Completá todos los campos.');
      return;
    }
    if (p1 != p2) {
      setState(() => _errorMessage = 'Las contraseñas no coinciden.');
      return;
    }
    if (p1.length < 8) {
      setState(() => _errorMessage = 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _repo.confirmPasswordReset(token: token, newPassword: p1);
      if (!mounted) return;
      setState(() => _success = true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'No se pudo restablecer la contraseña.';
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
        title: const Text('Restablecer contraseña'),
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
                if (_success) ...[
                  Semantics(
                    label: 'Icono de contraseña restablecida exitosamente',
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: const BoxDecoration(
                        color: Color(0xFFD1FAE5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check_circle_outline,
                        color: Color(0xFF059669),
                        size: 36,
                      ),
                    ),
                  ),
                  SizedBox(height: AppTheme.space5),
                  Text(
                    '¡Contraseña restablecida!',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  SizedBox(height: AppTheme.space3),
                  Text(
                    'Tu contraseña fue actualizada correctamente. Ya podés iniciar sesión con tu nueva contraseña.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                      height: 1.4,
                    ),
                  ),
                  SizedBox(height: AppTheme.space6),
                  Semantics(
                    label: 'Botón para ir al inicio de sesión',
                    button: true,
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () {
                          context.go('/login');
                        },
                        style: FilledButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          minimumSize: const Size(double.infinity, 48),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text('Iniciar sesión'),
                      ),
                    ),
                  ),
                ] else ...[
                  Semantics(
                    label: 'Icono de restablecimiento de contraseña',
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: const BoxDecoration(
                        color: Color(0xFFDBEAFE),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.key_rounded,
                        color: Color(0xFF2563EB),
                        size: 36,
                      ),
                    ),
                  ),
                  SizedBox(height: AppTheme.space5),
                  Text(
                    'Nueva contraseña',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  SizedBox(height: AppTheme.space3),
                  Text(
                    'Ingresá el código que recibiste por correo y elegí una nueva contraseña.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                      height: 1.4,
                    ),
                  ),
                  SizedBox(height: AppTheme.space5),
                  Container(
                    padding: EdgeInsets.all(AppTheme.space3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                        SizedBox(width: AppTheme.space2),
                        Expanded(
                          child: Text(
                            'En desarrollo, el código llega a Mailhog. Copialo del email y pegalo acá.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF1E40AF),
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: AppTheme.space5),
                  Semantics(
                    label: 'Campo para ingresar el código de recuperación recibido por correo',
                    child: TextField(
                      controller: _tokenController,
                      decoration: const InputDecoration(
                        labelText: 'Código de recuperación',
                        hintText: 'Pegá el token del email',
                        prefixIcon: Icon(Icons.password_rounded),
                      ),
                    ),
                  ),
                  SizedBox(height: AppTheme.space4),
                  Semantics(
                    label: 'Campo para nueva contraseña',
                    child: TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Nueva contraseña',
                        hintText: 'Mínimo 8 caracteres',
                        prefixIcon: const Icon(Icons.lock_outline_rounded),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
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
                  SizedBox(height: AppTheme.space4),
                  Semantics(
                    label: 'Campo para confirmar nueva contraseña',
                    child: TextField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirmPassword,
                      decoration: InputDecoration(
                        labelText: 'Confirmar contraseña',
                        hintText: 'Repetí la contraseña',
                        prefixIcon: const Icon(Icons.lock_person_outlined),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                          icon: Icon(
                            _obscureConfirmPassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: const Color(0xFF9CA3AF),
                          ),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: AppTheme.space5),
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
                  Semantics(
                    label: 'Botón para restablecer la contraseña',
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
                            : const Text('Restablecer contraseña'),
                      ),
                    ),
                  ),
                  SizedBox(height: AppTheme.space4),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: const Text('Cancelar'),
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

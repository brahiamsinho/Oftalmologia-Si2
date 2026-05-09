import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../config/app_config.dart';
import '../../../../config/theme.dart';
import '../../../../core/notifications/push_notifications.dart';
import '../../data/auth_repository.dart';
import '../providers/session_notifier.dart';

/// Registro público contra `POST /auth/register/`.
/// En móvil solo se admiten **pacientes** (`tipo_usuario` fijo `PACIENTE`).
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _nombresController = TextEditingController();
  final _apellidosController = TextEditingController();
  final _telefonoController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _numDocController = TextEditingController();

  String _tipoDocumento = 'DNI';
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isSaving = false;
  String? _errorMessage;

  static final _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _nombresController.dispose();
    _apellidosController.dispose();
    _telefonoController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _numDocController.dispose();
    super.dispose();
  }

  void _suggestUsernameFromEmail() {
    final email = _emailController.text.trim();
    if (email.isEmpty || _usernameController.text.trim().isNotEmpty) return;
    final local = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
    if (local.isNotEmpty) {
      _usernameController.text = local.length > 40 ? local.substring(0, 40) : local;
    }
  }

  Future<void> _submit() async {
    setState(() {
      _errorMessage = null;
    });

    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final nombres = _nombresController.text.trim();
    final apellidos = _apellidosController.text.trim();
    final p1 = _passwordController.text;
    final p2 = _confirmPasswordController.text;

    if (username.isEmpty ||
        email.isEmpty ||
        nombres.isEmpty ||
        apellidos.isEmpty ||
        p1.isEmpty ||
        p2.isEmpty) {
      setState(() => _errorMessage = 'Completá los campos obligatorios.');
      return;
    }
    if (!_emailRegex.hasMatch(email)) {
      setState(() => _errorMessage = 'Correo electrónico no válido.');
      return;
    }
    if (p1 != p2) {
      setState(() => _errorMessage = 'Las contraseñas no coinciden.');
      return;
    }

    final body = <String, dynamic>{
      'username': username,
      'email': email,
      'password': p1,
      'password2': p2,
      'nombres': nombres,
      'apellidos': apellidos,
      'tipo_usuario': 'PACIENTE',
      'tipo_documento': _tipoDocumento,
      'numero_documento': _numDocController.text.trim(),
    };
    final tel = _telefonoController.text.trim();
    if (tel.isNotEmpty) {
      body['telefono'] = tel;
    }

    final fcm = await PushNotifications.obtenerTokenYPlataformaParaAuth();
    if (fcm != null) {
      body.addAll(fcm);
    }

    setState(() => _isSaving = true);
    try {
      final result = await ref.read(authRepositoryProvider).register(body);
      if (!mounted) return;
      await _showPostRegisterDialog(email, result);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'No se pudo registrar.';
      });
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _showPostRegisterDialog(String email, RegistrationResult result) async {
    final mailhog = AppConfig.mailhogWebUrl;
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('¡Cuenta creada!'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  result.emailConfirmationSent
                      ? 'Te enviamos un correo de confirmación a:'
                      : 'Tu cuenta quedó activa. No pudimos enviar el correo ahora '
                          '(revisá Mailhog/SMTP en el servidor).',
                ),
                if (result.emailConfirmationSent) ...[
                  SizedBox(height: AppTheme.space2),
                  SelectableText(
                    email,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  SizedBox(height: AppTheme.space3),
                  Text(
                    mailhog != null
                        ? 'Con Docker + Mailhog, el mensaje aparece en la interfaz web de Mailhog (no en un buzón real).'
                        : 'Revisá tu bandeja de entrada (y spam). En desarrollo podés definir MAILHOG_WEB_URL en mobile/.env para abrir Mailhog desde la app.',
                    style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF64748B),
                          height: 1.35,
                        ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            if (mailhog != null)
              TextButton(
                onPressed: () async {
                  final uri = Uri.tryParse(mailhog);
                  if (uri != null &&
                      uri.hasScheme &&
                      (uri.scheme == 'http' || uri.scheme == 'https')) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
                child: const Text('Abrir Mailhog'),
              ),
            FilledButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                ref.read(sessionNotifierProvider.notifier).setAuthenticatedUser(result.user);
                context.go('/home');
              },
              child: const Text('Ir al inicio'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFEFF6FF),
              Color(0xFFF8FAFC),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(AppTheme.space5, AppTheme.space4, AppTheme.space5, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF1E40AF),
                      ),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                  ],
                ),
                SizedBox(height: AppTheme.space2),
                Text(
                  'Crear cuenta',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: AppTheme.space2),
                Text(
                  'Registro solo para pacientes. Los datos van al servidor de API_BASE_URL. '
                  'El correo de confirmación lo envía el backend (en desarrollo suele usar Mailhog).',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
                SizedBox(height: AppTheme.space3),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(AppTheme.space3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.mark_email_read_outlined, color: Colors.blue.shade700, size: 22),
                      SizedBox(width: AppTheme.space2),
                      Expanded(
                        child: Text(
                          'Mailhog (solo UI): MAILHOG_WEB_URL o MAILHOG_INFER_FROM_API=true '
                          '(mismo host que API, puerto MAILHOG_UI_PORT, ej. 8025). '
                          'El SMTP lo configura el backend/Docker, no esta app.',
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
                if (_errorMessage != null)
                  Container(
                    width: double.infinity,
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
                _Field(
                  label: 'Usuario *',
                  hint: 'Ej. juan_perez',
                  controller: _usernameController,
                  icon: Icons.alternate_email_outlined,
                ),
                SizedBox(height: AppTheme.space3),
                _Field(
                  label: 'Correo *',
                  hint: 'nombre@correo.com',
                  controller: _emailController,
                  icon: Icons.mail_outline_rounded,
                  keyboardType: TextInputType.emailAddress,
                  onEditingComplete: _suggestUsernameFromEmail,
                ),
                SizedBox(height: AppTheme.space3),
                _Field(
                  label: 'Nombres *',
                  controller: _nombresController,
                  icon: Icons.person_outline_rounded,
                ),
                SizedBox(height: AppTheme.space3),
                _Field(
                  label: 'Apellidos *',
                  controller: _apellidosController,
                  icon: Icons.person_outline_rounded,
                ),
                SizedBox(height: AppTheme.space3),
                _Field(
                  label: 'Teléfono',
                  controller: _telefonoController,
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                SizedBox(height: AppTheme.space3),
                Text(
                  'Documento (opcional)',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF374151),
                  ),
                ),
                SizedBox(height: AppTheme.space2),
                DropdownButtonFormField<String>(
                  key: ValueKey(_tipoDocumento),
                  initialValue: _tipoDocumento,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.description_outlined, color: Color(0xFF9CA3AF)),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'DNI', child: Text('DNI')),
                    DropdownMenuItem(value: 'PASAPORTE', child: Text('Pasaporte')),
                    DropdownMenuItem(value: 'NIE', child: Text('NIE')),
                    DropdownMenuItem(value: 'OTRO', child: Text('Otro')),
                  ],
                  onChanged: (v) {
                    if (v == null) return;
                    setState(() => _tipoDocumento = v);
                  },
                ),
                SizedBox(height: AppTheme.space2),
                _Field(
                  label: 'Número de documento',
                  controller: _numDocController,
                  icon: Icons.numbers_outlined,
                ),
                SizedBox(height: AppTheme.space3),
                _Field(
                  label: 'Contraseña *',
                  controller: _passwordController,
                  icon: Icons.lock_outline_rounded,
                  obscureText: _obscurePassword,
                  suffixIcon: IconButton(
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: const Color(0xFF9CA3AF),
                    ),
                  ),
                ),
                SizedBox(height: AppTheme.space3),
                _Field(
                  label: 'Confirmar contraseña *',
                  controller: _confirmPasswordController,
                  icon: Icons.lock_person_outlined,
                  obscureText: _obscureConfirmPassword,
                  suffixIcon: IconButton(
                    onPressed: () =>
                        setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                    icon: Icon(
                      _obscureConfirmPassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: const Color(0xFF9CA3AF),
                    ),
                  ),
                ),
                SizedBox(height: AppTheme.space6),
                Semantics(
                  label: 'Botón para registrar una nueva cuenta de paciente',
                  button: true,
                  child: FilledButton(
                    onPressed: _isSaving ? null : _submit,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(_isSaving ? 'Registrando…' : 'Registrarme'),
                  ),
                ),
                SizedBox(height: AppTheme.space3),
                Semantics(
                  label: 'Botón para volver al inicio de sesión',
                  button: true,
                  child: OutlinedButton(
                    onPressed: _isSaving ? null : () => context.pop(),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 52),
                      side: const BorderSide(color: Color(0xFFD1D5DB)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(
                      'Ya tengo cuenta',
                      style: theme.textTheme.labelLarge?.copyWith(color: const Color(0xFF374151)),
                    ),
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

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.controller,
    required this.icon,
    this.hint,
    this.keyboardType,
    this.obscureText = false,
    this.suffixIcon,
    this.onEditingComplete,
  });

  final String label;
  final TextEditingController controller;
  final IconData icon;
  final String? hint;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;
  final VoidCallback? onEditingComplete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: const Color(0xFF374151),
          ),
        ),
        SizedBox(height: AppTheme.space2),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          onEditingComplete: onEditingComplete,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: const Color(0xFF9CA3AF)),
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }
}

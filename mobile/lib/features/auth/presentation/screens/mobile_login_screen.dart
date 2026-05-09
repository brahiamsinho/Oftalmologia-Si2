import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../config/app_config.dart';
import '../providers/session_notifier.dart';
import '../widgets/login_actions.dart';
import '../widgets/login_form.dart';
import '../widgets/login_header.dart';

class MobileLoginScreen extends ConsumerStatefulWidget {
  const MobileLoginScreen({super.key});

  @override
  ConsumerState<MobileLoginScreen> createState() => _MobileLoginScreenState();
}

class _MobileLoginScreenState extends ConsumerState<MobileLoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  static final _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage =
            'Por favor ingresa tu correo y contraseña.';
      });
      return;
    }
    if (!_emailRegex.hasMatch(email)) {
      setState(() {
        _errorMessage =
            'Ingresá un correo electrónico válido (ej. nombre@correo.com).';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref
          .read(sessionNotifierProvider.notifier)
          .signIn(email, password);
      if (!mounted) return;
      context.go('/home');
    } catch (e, st) {
      debugPrint('Login error: $e\n$st');
      if (!mounted) return;
      setState(() {
        _errorMessage = e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'Error al iniciar sesión.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _openOptionalUrl(String? url, String missingMsg) async {
    if (url == null || url.isEmpty) {
      _snack(missingMsg);
      return;
    }
    final uri = Uri.tryParse(url);
    if (uri == null || !(uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https'))) {
      _snack('URL no válida en .env');
      return;
    }
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) _snack('No se pudo abrir el enlace.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF9FAFB),
              Color(0xFFF1F5F9),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const LoginHeader(),
                const SizedBox(height: 28),
                LoginForm(
                  emailController: _emailController,
                  passwordController: _passwordController,
                  errorMessage: _errorMessage,
                  isLoading: _isLoading,
                  onSubmit: _submit,
                  onForgotPassword: () => context.push('/forgot-password'),
                ),
                const SizedBox(height: 28),
                LoginActions(
                  onCreateAccount: () => context.push('/register'),
                  onTerms: () => _openOptionalUrl(
                    AppConfig.legalTermsUrl,
                    'Definí LEGAL_TERMS_URL en mobile/.env (URL https).',
                  ),
                  onPrivacy: () => _openOptionalUrl(
                    AppConfig.legalPrivacyUrl,
                    'Definí LEGAL_PRIVACY_URL en mobile/.env (URL https).',
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

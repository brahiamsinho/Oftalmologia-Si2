import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _selectedRole = 'Administrador';
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _isSaving = true);
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() => _isSaving = false);
    context.pop();
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
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF1D4ED8),
                        Color(0xFF1E3A8A),
                      ],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.12),
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.arrow_back_rounded),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        'Registro de usuarios',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Crea cuentas con el mismo lenguaje visual del frontend para tus casos de uso moviles.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFFDBEAFE),
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Nuevo usuario',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: const Color(0xFF111827),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Completa los datos base para registrar un usuario dentro del sistema.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF6B7280),
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _RegisterTextField(
                        label: 'Nombre completo',
                        hint: 'Ej. Orlando Moreno',
                        controller: _nameController,
                        prefixIcon: Icons.person_outline_rounded,
                      ),
                      const SizedBox(height: 16),
                      _RegisterTextField(
                        label: 'Correo electronico',
                        hint: 'usuario@clinica.com',
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        prefixIcon: Icons.mail_outline_rounded,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Rol de usuario',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF374151),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _selectedRole,
                        decoration: const InputDecoration(
                          prefixIcon: Icon(
                            Icons.badge_outlined,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'Administrador',
                            child: Text('Administrador'),
                          ),
                          DropdownMenuItem(
                            value: 'Doctor',
                            child: Text('Doctor'),
                          ),
                          DropdownMenuItem(
                            value: 'Paciente',
                            child: Text('Paciente'),
                          ),
                        ],
                        onChanged: (value) {
                          if (value == null) return;
                          setState(() => _selectedRole = value);
                        },
                      ),
                      const SizedBox(height: 16),
                      _RegisterTextField(
                        label: 'Contrasena',
                        hint: 'Crea una contrasena segura',
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        prefixIcon: Icons.lock_outline_rounded,
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: const Color(0xFF9CA3AF),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _RegisterTextField(
                        label: 'Confirmar contrasena',
                        hint: 'Repite la contrasena',
                        controller: _confirmPasswordController,
                        obscureText: _obscureConfirmPassword,
                        prefixIcon: Icons.lock_person_outlined,
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _obscureConfirmPassword =
                                  !_obscureConfirmPassword;
                            });
                          },
                          icon: Icon(
                            _obscureConfirmPassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: const Color(0xFF9CA3AF),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _submit,
                          child: Text(
                            _isSaving ? 'Guardando...' : 'Registrar usuario',
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      OutlinedButton(
                        onPressed: () => context.pop(),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 52),
                          side: const BorderSide(color: Color(0xFFD1D5DB)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Text(
                          'Volver al login',
                          style: theme.textTheme.labelLarge?.copyWith(
                            color: const Color(0xFF374151),
                          ),
                        ),
                      ),
                    ],
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

class _RegisterTextField extends StatelessWidget {
  const _RegisterTextField({
    required this.label,
    required this.hint,
    required this.controller,
    required this.prefixIcon,
    this.keyboardType,
    this.obscureText = false,
    this.suffixIcon,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final IconData prefixIcon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;

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
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(prefixIcon, color: const Color(0xFF9CA3AF)),
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }
}

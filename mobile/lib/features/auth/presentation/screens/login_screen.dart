import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Pantalla de Login — placeholder para autenticación.
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF134E4A),
              Color(0xFF0F766E),
              Color(0xFF1E40AF),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Logo
                      const Text('👁️', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 12),
                      Text(
                        'Oftalmología Si2',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          color: const Color(0xFF0F766E),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Sistema de Gestión Clínica',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Email field
                      TextField(
                        decoration: const InputDecoration(
                          labelText: 'Correo electrónico',
                          hintText: 'doctor@clinica.com',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),

                      // Password field
                      TextField(
                        decoration: const InputDecoration(
                          labelText: 'Contraseña',
                          hintText: '••••••••',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 24),

                      // Login button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // TODO: Implementar autenticación
                            context.go('/home');
                          },
                          child: const Text('Iniciar Sesión'),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Forgot password
                      TextButton(
                        onPressed: () {
                          // TODO: Recuperar contraseña
                        },
                        child: const Text('¿Olvidaste tu contraseña?'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../config/theme.dart';

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
              padding: EdgeInsets.all(AppTheme.space6),
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
                      SizedBox(height: AppTheme.space3),
                      Text(
                        'Oftalmología Si2',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          color: const Color(0xFF0F766E),
                        ),
                      ),
                      SizedBox(height: AppTheme.space1),
                      Text(
                        'Sistema de Gestión Clínica',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Email field
                      Semantics(
                        label: 'Campo de correo electrónico para iniciar sesión',
                        child: const TextField(
                          decoration: InputDecoration(
                            labelText: 'Correo electrónico',
                            hintText: 'doctor@clinica.com',
                            prefixIcon: Icon(Icons.email_outlined),
                          ),
                          keyboardType: TextInputType.emailAddress,
                        ),
                      ),
                      SizedBox(height: AppTheme.space4),

                      // Password field
                      Semantics(
                        label: 'Campo de contraseña',
                        child: const TextField(
                          decoration: InputDecoration(
                            labelText: 'Contraseña',
                            hintText: '••••••••',
                            prefixIcon: Icon(Icons.lock_outline),
                          ),
                          obscureText: true,
                        ),
                      ),
                      SizedBox(height: AppTheme.space6),

                      // Login button
                      Semantics(
                        label: 'Botón para iniciar sesión en la aplicación',
                        button: true,
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              // TODO: Implementar autenticación
                              context.go('/home');
                            },
                            child: const Text('Iniciar Sesión'),
                          ),
                        ),
                      ),
                      SizedBox(height: AppTheme.space4),

                      // Forgot password
                      Semantics(
                        label: 'Opción para recuperar contraseña olvidada',
                        child: TextButton(
                          onPressed: () {
                            // TODO: Recuperar contraseña
                          },
                          child: const Text('¿Olvidaste tu contraseña?'),
                        ),
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

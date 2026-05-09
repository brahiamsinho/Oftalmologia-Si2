import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'auth_listenable.dart';
import '../features/auth/presentation/screens/mobile_login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/auth/presentation/screens/forgot_password_screen.dart';
import '../features/auth/presentation/screens/reset_password_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/home/presentation/screens/schedule_appointment_screen.dart';

/// Configuración de rutas de la aplicación.
final GoRouter appRouter = GoRouter(
  initialLocation: '/login',
  refreshListenable: authListenable,
  redirect: (BuildContext context, GoRouterState state) {
    final loc = state.matchedLocation;
    final isAuthRoute = loc == '/login' ||
        loc == '/register' ||
        loc == '/forgot-password' ||
        loc == '/reset-password';
    final loggedIn = authListenable.value;
    if (!loggedIn && !isAuthRoute) return '/login';
    if (loggedIn && isAuthRoute) return '/home';
    return null;
  },
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const MobileLoginScreen(),
    ),
    GoRoute(
      path: '/register',
      name: 'register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      name: 'forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/reset-password',
      name: 'reset-password',
      builder: (context, state) => const ResetPasswordScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/schedule-appointment',
      name: 'schedule-appointment',
      builder: (context, state) => const ScheduleAppointmentScreen(),
    ),
  ],
);

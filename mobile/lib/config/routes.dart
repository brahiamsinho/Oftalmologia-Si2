import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'auth_listenable.dart';
import '../features/auth/presentation/screens/mobile_login_screen.dart';
import '../features/auth/presentation/screens/tenant_workspace_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/auth/presentation/screens/forgot_password_screen.dart';
import '../features/auth/presentation/screens/reset_password_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/home/presentation/screens/schedule_appointment_screen.dart';
import '../features/ia/presentation/screens/virtual_assistant_screen.dart';
import '../features/ia/presentation/screens/patient_virtual_assistant_screen.dart';

/// Configuración de rutas de la aplicación.
final GoRouter appRouter = GoRouter(
  initialLocation: '/workspace',
  refreshListenable: authListenable,
  redirect: (BuildContext context, GoRouterState state) {
    final loc = state.matchedLocation;
    final isWorkspaceRoute = loc == '/workspace';
    final isAuthRoute = loc == '/login' ||
        loc == '/register' ||
        loc == '/forgot-password' ||
        loc == '/reset-password';
    final status = authListenable.value;

    if (status == AppSessionStatus.needsTenant && !isWorkspaceRoute) {
      return '/workspace';
    }

    if (status == AppSessionStatus.unauthenticated) {
      if (isWorkspaceRoute) return '/login';
      if (!isAuthRoute) return '/login';
    }

    if (status == AppSessionStatus.authenticated && (isAuthRoute || isWorkspaceRoute)) {
      return '/home';
    }

    return null;
  },
  routes: [
    GoRoute(
      path: '/workspace',
      name: 'workspace',
      builder: (context, state) => const TenantWorkspaceScreen(),
    ),
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
    GoRoute(
      path: '/asistente-virtual',
      name: 'asistente-virtual',
      builder: (context, state) => const VirtualAssistantScreen(),
    ),
    GoRoute(
      path: '/asistente-virtual-paciente',
      name: 'asistente-virtual-paciente',
      builder: (context, state) => const PatientVirtualAssistantScreen(),
    ),
  ],
);

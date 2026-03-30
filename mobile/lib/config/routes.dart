import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'auth_listenable.dart';
import '../features/auth/presentation/screens/mobile_login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';

/// Configuración de rutas de la aplicación.
final GoRouter appRouter = GoRouter(
  initialLocation: '/login',
  refreshListenable: authListenable,
  redirect: (BuildContext context, GoRouterState state) {
    final loc = state.matchedLocation;
    final isAuthRoute = loc == '/login' || loc == '/register';
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
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
  ],
);

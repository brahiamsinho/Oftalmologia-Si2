import 'package:go_router/go_router.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';

/// Configuración de rutas de la aplicación.
final GoRouter appRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    // Auth
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),

    // Home / Dashboard
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),

    // TODO: Fase 2 — Agregar rutas para:
    // - /patients
    // - /appointments
    // - /records
    // - /profile
  ],

  // Redirect si no está autenticado
  // redirect: (context, state) {
  //   final isLogged = /* check auth state */;
  //   final isLoginRoute = state.matchedLocation == '/login';
  //   if (!isLogged && !isLoginRoute) return '/login';
  //   if (isLogged && isLoginRoute) return '/home';
  //   return null;
  // },
);

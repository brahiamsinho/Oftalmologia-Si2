import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/domain/auth_user.dart';
import '../../../auth/presentation/providers/session_notifier.dart';
import '../widgets/patient_appointments_section.dart';
import '../widgets/patient_home_header.dart';
import '../widgets/patient_next_appointment_card.dart';
import '../widgets/patient_quick_access_row.dart';
import '../providers/patient_citas_provider.dart';

class PatientHomeScreen extends ConsumerStatefulWidget {
  const PatientHomeScreen({super.key});

  @override
  ConsumerState<PatientHomeScreen> createState() => _PatientHomeScreenState();
}

class _PatientHomeScreenState extends ConsumerState<PatientHomeScreen> {
  int _navIndex = 0;

  String _firstName(AuthUser u) {
    final n = u.nombres?.trim();
    if (n != null && n.isNotEmpty) return n;
    final parts = u.displayName.trim().split(RegExp(r'\s+'));
    return parts.isNotEmpty ? parts.first : u.username;
  }

  String _initials(AuthUser u) {
    final n = u.nombres?.trim() ?? '';
    final a = u.apellidos?.trim() ?? '';
    if (n.isNotEmpty && a.isNotEmpty) {
      return '${n[0]}${a[0]}'.toUpperCase();
    }
    if (u.username.isNotEmpty) return u.username[0].toUpperCase();
    return '?';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(sessionNotifierProvider);
    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: IndexedStack(
        index: _navIndex,
        children: [
          _InicioTab(
            firstName: _firstName(user),
            initials: _initials(user),
            onRefresh: () => ref.read(patientCitasProvider.notifier).refresh(),
          ),
          _PlaceholderTab(
            title: 'Citas',
            subtitle: 'Aquí verás el calendario y gestión de turnos.',
          ),
          _ProfileTab(
            onLogout: () async {
              await ref.read(sessionNotifierProvider.notifier).signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (i) => setState(() => _navIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Inicio',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month_rounded),
            label: 'Citas',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}

class _InicioTab extends ConsumerWidget {
  const _InicioTab({
    required this.firstName,
    required this.initials,
    required this.onRefresh,
  });

  final String firstName;
  final String initials;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: const Color(0xFF2563EB),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: PatientHomeHeader(
              userDisplayName: firstName,
              initials: initials,
              onNotifications: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Notificaciones próximamente.')),
                );
              },
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Text(
                '↓ Deslizá para actualizar',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF94A3B8),
                    ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: PatientNextAppointmentCard()),
          const SliverToBoxAdapter(child: SizedBox(height: 20)),
          const SliverToBoxAdapter(child: PatientQuickAccessRow()),
          const SliverToBoxAdapter(child: PatientAppointmentsSection()),
        ],
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.construction_rounded,
                size: 56,
                color: theme.colorScheme.primary.withValues(alpha: 0.5),
              ),
              const SizedBox(height: 16),
              Text(title, style: theme.textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Perfil',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.logout_rounded),
            title: const Text('Cerrar sesión'),
            onTap: onLogout,
          ),
        ],
      ),
    );
  }
}

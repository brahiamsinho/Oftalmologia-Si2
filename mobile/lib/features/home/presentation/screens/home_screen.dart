import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../auth/presentation/providers/session_notifier.dart';
import '../../data/staff_dashboard_repository.dart';
import '../../domain/cita_resumen.dart';
import '../providers/patient_citas_provider.dart';
import '../providers/staff_pacientes_list_provider.dart';
import 'patient_home_screen.dart';

/// Enruta: paciente → [PatientHomeScreen]; resto → panel staff con datos del API.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionNotifierProvider);
    if (user?.tipoUsuario == 'PACIENTE') {
      return const PatientHomeScreen();
    }
    return const _StaffHomeShell();
  }
}

class _StaffHomeShell extends ConsumerStatefulWidget {
  const _StaffHomeShell();

  @override
  ConsumerState<_StaffHomeShell> createState() => _StaffHomeShellState();
}

class _StaffHomeShellState extends ConsumerState<_StaffHomeShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _tab,
        children: const [
          _StaffDashboardTab(),
          _StaffCitasTab(),
          _StaffPacientesTab(),
          _StaffProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today),
            label: 'Citas',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Pacientes',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}

class _StaffDashboardTab extends ConsumerWidget {
  const _StaffDashboardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(staffDashboardProvider);
    final user = ref.watch(sessionNotifierProvider);
    final theme = Theme.of(context);
    final greeting = user == null ? 'Bienvenido' : 'Hola, ${user.displayName}';

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(staffDashboardProvider);
        await ref.read(staffDashboardProvider.future);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            title: const Text('Resumen'),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Notificaciones: próximamente.')),
                  );
                },
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(greeting, style: theme.textTheme.headlineSmall),
                Text(
                  'Datos en vivo desde el API',
                  style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                async.when(
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(48),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (e, _) => Text('Error: $e'),
                  data: (d) {
                    if (d.loadError != null) {
                      return _ErrorCard(message: d.loadError!);
                    }
                    return Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _StatCard(
                                icon: Icons.people_outline,
                                title: 'Pacientes',
                                value: _fmtCount(d.pacientesCount),
                                color: const Color(0xFF0F766E),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _StatCard(
                                icon: Icons.calendar_today_outlined,
                                title: 'Citas',
                                value: _fmtCount(d.citasTotales),
                                color: const Color(0xFF1E40AF),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _StatCard(
                                icon: Icons.medical_services_outlined,
                                title: 'Especialistas',
                                value: _fmtCount(d.especialistasCount),
                                color: const Color(0xFFF59E0B),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _StatCard(
                                icon: Icons.assignment_turned_in_outlined,
                                title: 'Citas atendidas',
                                value: _fmtCount(d.citasAtendidas),
                                color: const Color(0xFF16A34A),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Text('Próximas citas', style: theme.textTheme.titleLarge),
                        const SizedBox(height: 12),
                        if (d.proximasCitas.isEmpty)
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Center(
                                child: Text(
                                  'No hay citas en la primera página del listado.',
                                  style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
                                ),
                              ),
                            ),
                          )
                        else
                          ...d.proximasCitas.map((c) => _StaffCitaCard(cita: c)),
                      ],
                    );
                  },
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  static String _fmtCount(int? n) {
    if (n == null) return '—';
    return '$n';
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(message, style: TextStyle(color: Colors.red.shade900)),
      ),
    );
  }
}

class _StaffCitaCard extends StatelessWidget {
  const _StaffCitaCard({required this.cita});

  final CitaResumen cita;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final when = DateFormat('EEE d MMM · HH:mm', 'es').format(cita.fechaHoraInicio.toLocal());
    final paciente = cita.pacienteNombre?.trim();
    final line = paciente != null && paciente.isNotEmpty
        ? '$paciente · ${cita.especialistaNombre}'
        : cita.especialistaNombre;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(line, maxLines: 2, overflow: TextOverflow.ellipsis),
        subtitle: Text(
          '${cita.tipoCitaNombre} · ${cita.estado}',
          style: theme.textTheme.bodySmall,
        ),
        trailing: Text(
          when,
          style: theme.textTheme.labelSmall,
        ),
      ),
    );
  }
}

class _StaffCitasTab extends ConsumerWidget {
  const _StaffCitasTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(patientCitasProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Citas')),
      body: RefreshIndicator(
        onRefresh: () => ref.read(patientCitasProvider.notifier).refresh(),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              Padding(
                padding: const EdgeInsets.all(24),
                child: Text('$e', style: theme.textTheme.bodyMedium),
              ),
            ],
          ),
          data: (list) {
            if (list.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text('No hay citas para tu usuario.')),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final c = list[i];
                final dt = DateFormat('dd/MM/yyyy HH:mm').format(c.fechaHoraInicio.toLocal());
                final sub = c.pacienteNombre != null && c.pacienteNombre!.trim().isNotEmpty
                    ? '${c.pacienteNombre} · ${c.especialistaNombre}'
                    : c.especialistaNombre;
                return Card(
                  child: ListTile(
                    title: Text(sub),
                    subtitle: Text('${c.tipoCitaNombre} · ${c.estado}'),
                    trailing: Text(dt, style: theme.textTheme.labelSmall),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _StaffPacientesTab extends ConsumerWidget {
  const _StaffPacientesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(staffPacientesListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pacientes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(staffPacientesListProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(staffPacientesListProvider);
          await ref.read(staffPacientesListProvider.future);
        },
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) {
            final is403 = e is StaffPacientesForbidden;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              children: [
                Icon(
                  is403 ? Icons.lock_outline : Icons.error_outline,
                  size: 48,
                  color: Colors.grey,
                ),
                const SizedBox(height: 16),
                Text(
                  is403
                      ? 'Tu rol no tiene acceso al listado de pacientes. Usá el panel web para esa gestión.'
                      : '$e',
                  textAlign: TextAlign.center,
                ),
              ],
            );
          },
          data: (rows) {
            if (rows.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 100),
                  Center(child: Text('No hay pacientes en la primera página.')),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final m = rows[i];
                final n = '${m['nombres'] ?? ''} ${m['apellidos'] ?? ''}'.trim();
                final doc = m['numero_documento'] as String?;
                return ListTile(
                  title: Text(n.isEmpty ? 'Paciente' : n),
                  subtitle: doc != null && doc.isNotEmpty ? Text(doc) : null,
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _StaffProfileTab extends ConsumerWidget {
  const _StaffProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionNotifierProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (user != null) ...[
            Text(user.displayName, style: theme.textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(user.email, style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey)),
            const SizedBox(height: 4),
            Text(
              user.tipoUsuario.replaceAll('_', ' '),
              style: theme.textTheme.labelLarge,
            ),
          ],
          const SizedBox(height: 32),
          ListTile(
            leading: const Icon(Icons.logout_rounded),
            title: const Text('Cerrar sesión'),
            onTap: () async {
              await ref.read(sessionNotifierProvider.notifier).signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

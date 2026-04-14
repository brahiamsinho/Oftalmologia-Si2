import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../../domain/notificacion.dart';
import '../providers/notificaciones_provider.dart';

class NotificacionesScreen extends ConsumerStatefulWidget {
  const NotificacionesScreen({super.key});

  @override
  ConsumerState<NotificacionesScreen> createState() => _NotificacionesScreenState();
}

class _NotificacionesScreenState extends ConsumerState<NotificacionesScreen> {
  @override
  void initState() {
    super.initState();
    // Cargar al entrar a la pantalla.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificacionesProvider.notifier).load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificacionesProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Notificaciones',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        actions: [
          if (state.noLeidas > 0)
            TextButton(
              onPressed: () {
                ref.read(notificacionesProvider.notifier).marcarTodasLeidas();
              },
              child: const Text(
                'Leer todas',
                style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
      body: _buildBody(context, state),
    );
  }

  Widget _buildBody(BuildContext context, NotificacionesState state) {
    if (state.isLoading && state.items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null && state.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFFEE2E2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 32),
              ),
              const SizedBox(height: 16),
              Text(
                'No pudimos cargar las notificaciones',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                state.error!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
              ),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: () => ref.read(notificacionesProvider.notifier).load(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Reintentar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primaryColor,
                  side: const BorderSide(color: AppTheme.primaryColor),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(
                  Icons.notifications_none_rounded,
                  color: AppTheme.primaryColor,
                  size: 40,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Sin notificaciones',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.secondaryColor,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Acá vas a ver tus avisos de citas, sesiones y más.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textMuted,
                      height: 1.4,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primaryColor,
      onRefresh: () => ref.read(notificacionesProvider.notifier).load(),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 12),
        itemCount: state.items.length,
        separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
        itemBuilder: (context, i) {
          final notif = state.items[i];
          return _NotifTile(
            notif: notif,
            onTap: () {
              if (!notif.leida) {
                ref.read(notificacionesProvider.notifier).marcarLeida(notif.id);
              }
            },
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tile individual
// ---------------------------------------------------------------------------

class _NotifTile extends StatelessWidget {
  const _NotifTile({required this.notif, required this.onTap});

  final Notificacion notif;
  final VoidCallback onTap;

  IconData _icon() {
    switch (notif.tipo) {
      case 'registro':
        return Icons.person_add_rounded;
      case 'login':
        return Icons.login_rounded;
      case 'cita':
        return Icons.calendar_month_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _iconBg() {
    switch (notif.tipo) {
      case 'registro':
        return const Color(0xFFD1FAE5);
      case 'login':
        return const Color(0xFFDBEAFE);
      case 'cita':
        return const Color(0xFFFEF3C7);
      default:
        return const Color(0xFFE2E8F0);
    }
  }

  Color _iconColor() {
    switch (notif.tipo) {
      case 'registro':
        return const Color(0xFF047857);
      case 'login':
        return AppTheme.primaryColor;
      case 'cita':
        return const Color(0xFFB45309);
      default:
        return const Color(0xFF475569);
    }
  }

  String _timeAgo() {
    final diff = DateTime.now().difference(notif.creadaEn);
    if (diff.inMinutes < 1) return 'Ahora';
    if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
    if (diff.inDays < 7) return 'Hace ${diff.inDays} día${diff.inDays > 1 ? 's' : ''}';
    return DateFormat('d MMM yyyy', 'es').format(notif.creadaEn);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final unread = !notif.leida;

    return InkWell(
      onTap: onTap,
      child: Container(
        color: unread ? const Color(0xFFF0F7FF) : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _iconBg(),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_icon(), color: _iconColor(), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notif.titulo,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: unread ? FontWeight.w700 : FontWeight.w500,
                            color: const Color(0xFF0F172A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _timeAgo(),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: AppTheme.textMuted,
                        ),
                      ),
                      if (unread) ...[
                        const SizedBox(width: 6),
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notif.cuerpo,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppTheme.textMuted,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PatientHomeHeader extends StatelessWidget {
  const PatientHomeHeader({
    super.key,
    required this.userDisplayName,
    required this.initials,
    this.onNotifications,
    this.showNotificationDot = false,
    this.noLeidasCount = 0,
  });

  final String userDisplayName;
  final String initials;
  final VoidCallback? onNotifications;
  final bool showNotificationDot;
  final int noLeidasCount;

  String _saludo() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final today = DateTime.now();
    final dateStr = DateFormat("EEEE, d 'de' MMMM 'de' y", 'es').format(today);

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1D4ED8),
            Color(0xFF2563EB),
            Color(0xFF1E40AF),
          ],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -40,
            top: -20,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
          ),
          Positioned(
            left: -30,
            bottom: 10,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              8 + MediaQuery.paddingOf(context).top,
              20,
              28,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.white.withValues(alpha: 0.2),
                      child: Text(
                        initials,
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_saludo()}, $userDisplayName 👋',
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.calendar_today_outlined,
                                  size: 16,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    _capitalizeDate(dateStr),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Material(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        onTap: onNotifications,
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          width: 44,
                          height: 44,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              const Icon(
                                Icons.notifications_outlined,
                                color: Colors.white,
                                size: 22,
                              ),
                              if (showNotificationDot)
                                Positioned(
                                  top: 6,
                                  right: 6,
                                  child: Container(
                                    padding: noLeidasCount > 9
                                        ? const EdgeInsets.symmetric(horizontal: 4, vertical: 1)
                                        : EdgeInsets.zero,
                                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEF4444),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: noLeidasCount > 0
                                        ? Text(
                                            noLeidasCount > 99 ? '99+' : '$noLeidasCount',
                                            textAlign: TextAlign.center,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 9,
                                              fontWeight: FontWeight.w700,
                                              height: 1.4,
                                            ),
                                          )
                                        : const SizedBox.shrink(),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static String _capitalizeDate(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }
}

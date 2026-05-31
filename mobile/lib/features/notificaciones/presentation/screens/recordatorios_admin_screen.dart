import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/network/api_client.dart';
import '../../../../../config/theme.dart';
import 'package:dio/dio.dart';

/// CU18 (staff) — Ver y gestionar reglas de recordatorio automático.
/// Solo visible para rol ADMINISTRATIVO / ADMIN.
class RecordatoriosAdminScreen extends ConsumerStatefulWidget {
  const RecordatoriosAdminScreen({super.key});

  @override
  ConsumerState<RecordatoriosAdminScreen> createState() =>
      _RecordatoriosAdminScreenState();
}

// ── Modelos inline simples ─────────────────────────────────────────────────

class _Regla {
  const _Regla({
    required this.id,
    required this.nombre,
    required this.tipoRegla,
    required this.horasAntes,
    required this.activa,
    required this.tituloTemplate,
  });

  final String id;
  final String nombre;
  final String tipoRegla;
  final int horasAntes;
  final bool activa;
  final String tituloTemplate;

  factory _Regla.fromJson(Map<String, dynamic> j) => _Regla(
        id: j['id_regla']?.toString() ?? '',
        nombre: j['nombre']?.toString() ?? '',
        tipoRegla: j['tipo_regla']?.toString() ?? '',
        horasAntes: (j['horas_antes'] as num?)?.toInt() ?? 24,
        activa: j['activa'] as bool? ?? true,
        tituloTemplate: j['titulo_template']?.toString() ?? '',
      );
}

class _Tarea {
  const _Tarea({
    required this.id,
    required this.estado,
    required this.programadaPara,
    this.nombrePaciente,
    required this.intentos,
  });

  final String id;
  final String estado;
  final DateTime programadaPara;
  final String? nombrePaciente;
  final int intentos;

  factory _Tarea.fromJson(Map<String, dynamic> j) => _Tarea(
        id: j['id_tarea']?.toString() ?? '',
        estado: j['estado']?.toString() ?? '',
        programadaPara:
            DateTime.tryParse(j['programada_para']?.toString() ?? '') ?? DateTime.now(),
        nombrePaciente: j['nombre_paciente']?.toString(),
        intentos: (j['intentos'] as num?)?.toInt() ?? 0,
      );
}

// ── Screen ─────────────────────────────────────────────────────────────────

class _RecordatoriosAdminScreenState
    extends ConsumerState<RecordatoriosAdminScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  late final Dio _dio;

  List<_Regla> _reglas = [];
  List<_Tarea> _tareas = [];
  bool _loadingReglas = false;
  bool _loadingTareas = false;
  bool _procesando = false;
  String? _errorReglas;
  String? _errorTareas;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _dio = ApiClient().dio;
    _loadReglas();
    _loadTareas();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _loadReglas() async {
    setState(() {
      _loadingReglas = true;
      _errorReglas = null;
    });
    try {
      final res = await _dio.get<dynamic>('notificaciones/reglas/');
      final raw = res.data;
      final list = raw is Map ? (raw['results'] as List? ?? []) : raw as List;
      setState(() {
        _reglas = list
            .map((e) => _Regla.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      });
    } catch (e) {
      setState(() => _errorReglas = 'No se pudieron cargar las reglas.');
    } finally {
      setState(() => _loadingReglas = false);
    }
  }

  Future<void> _loadTareas() async {
    setState(() {
      _loadingTareas = true;
      _errorTareas = null;
    });
    try {
      final res = await _dio.get<dynamic>('notificaciones/tareas/');
      final raw = res.data;
      final list = raw is Map ? (raw['results'] as List? ?? []) : raw as List;
      setState(() {
        _tareas = list
            .map((e) => _Tarea.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      });
    } catch (e) {
      setState(() => _errorTareas = 'No se pudieron cargar las tareas.');
    } finally {
      setState(() => _loadingTareas = false);
    }
  }

  Future<void> _procesarPendientes() async {
    setState(() => _procesando = true);
    try {
      final res = await _dio.post<dynamic>('notificaciones/tareas/procesar/');
      final body = res.data as Map<String, dynamic>? ?? {};
      final n = body['procesadas'] as int? ?? 0;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ $n tarea(s) procesada(s)'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        await _loadTareas();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al procesar recordatorios.'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _procesando = false);
    }
  }

  Future<void> _toggleRegla(_Regla regla) async {
    try {
      await _dio.patch<dynamic>(
        'notificaciones/reglas/${regla.id}/',
        data: {'activa': !regla.activa},
      );
      await _loadReglas();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo actualizar la regla.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Recordatorios',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        bottom: TabBar(
          controller: _tab,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          unselectedLabelColor: AppTheme.textMuted,
          labelColor: AppTheme.primaryColor,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'Reglas'),
            Tab(text: 'Tareas'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          _ReglasList(
            loading: _loadingReglas,
            error: _errorReglas,
            reglas: _reglas,
            onRefresh: _loadReglas,
            onToggle: _toggleRegla,
          ),
          _TareasList(
            loading: _loadingTareas,
            error: _errorTareas,
            tareas: _tareas,
            onRefresh: _loadTareas,
            procesando: _procesando,
            onProcesar: _procesarPendientes,
          ),
        ],
      ),
    );
  }
}

// ── Tab Reglas ─────────────────────────────────────────────────────────────

class _ReglasList extends StatelessWidget {
  const _ReglasList({
    required this.loading,
    required this.error,
    required this.reglas,
    required this.onRefresh,
    required this.onToggle,
  });

  final bool loading;
  final String? error;
  final List<_Regla> reglas;
  final VoidCallback onRefresh;
  final void Function(_Regla) onToggle;

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(error!,
                style: const TextStyle(color: AppTheme.textMuted)),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }
    if (reglas.isEmpty) {
      return const Center(
        child: Text(
          'Sin reglas configuradas',
          style: TextStyle(color: AppTheme.textMuted),
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primaryColor,
      onRefresh: () async => onRefresh(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: reglas.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (ctx, i) => _ReglaCard(regla: reglas[i], onToggle: onToggle),
      ),
    );
  }
}

class _ReglaCard extends StatelessWidget {
  const _ReglaCard({required this.regla, required this.onToggle});
  final _Regla regla;
  final void Function(_Regla) onToggle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tipoLabel = regla.tipoRegla == 'RECORDATORIO_CITA'
        ? 'Recordatorio de cita'
        : 'Control postoperatorio';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(color: Color(0x08000000), blurRadius: 6, offset: Offset(0, 2)),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: regla.activa
                ? const Color(0xFFDBEAFE)
                : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(
            Icons.notifications_active_outlined,
            color: regla.activa ? AppTheme.primaryColor : AppTheme.textMuted,
            size: 22,
          ),
        ),
        title: Text(
          regla.nombre,
          style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '$tipoLabel · ${regla.horasAntes}h antes',
          style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
        ),
        trailing: Switch(
          value: regla.activa,
          onChanged: (_) => onToggle(regla),
          activeColor: AppTheme.primaryColor,
        ),
      ),
    );
  }
}

// ── Tab Tareas ─────────────────────────────────────────────────────────────

class _TareasList extends StatelessWidget {
  const _TareasList({
    required this.loading,
    required this.error,
    required this.tareas,
    required this.onRefresh,
    required this.procesando,
    required this.onProcesar,
  });

  final bool loading;
  final String? error;
  final List<_Tarea> tareas;
  final VoidCallback onRefresh;
  final bool procesando;
  final VoidCallback onProcesar;

  Color _estadoColor(String e) {
    switch (e) {
      case 'PENDIENTE':
        return const Color(0xFFD97706);
      case 'PROCESADA':
        return AppTheme.successColor;
      case 'ERROR':
        return AppTheme.errorColor;
      default:
        return AppTheme.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendientes = tareas.where((t) => t.estado == 'PENDIENTE').length;

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              if (pendientes > 0)
                Chip(
                  label: Text('$pendientes pendiente(s)'),
                  backgroundColor: const Color(0xFFFEF3C7),
                  labelStyle: const TextStyle(
                    color: Color(0xFFD97706),
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              const Spacer(),
              FilledButton.icon(
                onPressed: procesando ? null : onProcesar,
                icon: procesando
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.play_arrow_rounded, size: 18),
                label: Text(procesando ? 'Procesando…' : 'Procesar'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.successColor,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator())
              : error != null
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(error!,
                              style: const TextStyle(color: AppTheme.textMuted)),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: onRefresh,
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('Reintentar'),
                          ),
                        ],
                      ),
                    )
                  : tareas.isEmpty
                      ? const Center(
                          child: Text('Sin tareas programadas',
                              style: TextStyle(color: AppTheme.textMuted)),
                        )
                      : RefreshIndicator(
                          color: AppTheme.primaryColor,
                          onRefresh: () async => onRefresh(),
                          child: ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: tareas.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (ctx, i) {
                              final t = tareas[i];
                              return ListTile(
                                tileColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                leading: CircleAvatar(
                                  backgroundColor: _estadoColor(t.estado).withOpacity(0.1),
                                  child: Icon(
                                    Icons.alarm_outlined,
                                    color: _estadoColor(t.estado),
                                    size: 20,
                                  ),
                                ),
                                title: Text(
                                  t.nombrePaciente ?? 'Paciente ${t.id.substring(0, 6)}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600, fontSize: 14),
                                ),
                                subtitle: Text(
                                  '${t.programadaPara.day}/${t.programadaPara.month}/${t.programadaPara.year} · ${t.intentos} intento(s)',
                                  style: const TextStyle(
                                      fontSize: 12, color: AppTheme.textMuted),
                                ),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _estadoColor(t.estado).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    t.estado,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: _estadoColor(t.estado),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }
}

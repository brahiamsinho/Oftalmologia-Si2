import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../../data/citas_repository.dart';

/// Pantalla para agendar una nueva cita.
/// Flujo de 3 pasos:
///   1. Elegir especialista y tipo de cita
///   2. Elegir fecha y hora
///   3. Confirmar y enviar
class ScheduleAppointmentScreen extends StatefulWidget {
  const ScheduleAppointmentScreen({super.key});

  @override
  State<ScheduleAppointmentScreen> createState() =>
      _ScheduleAppointmentScreenState();
}

class _ScheduleAppointmentScreenState extends State<ScheduleAppointmentScreen> {
  final _repo = CitasRepository();
  final _motivoController = TextEditingController();

  int _step = 0;
  bool _isLoading = false;
  String? _errorMessage;

  // Paso 1
  Map<String, dynamic>? _selectedSpecialist;
  Map<String, dynamic>? _selectedAppointmentType;
  List<Map<String, dynamic>> _specialists = [];
  List<Map<String, dynamic>> _appointmentTypes = [];

  // Paso 2
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _motivoController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _repo.getAvailableSpecialists(),
        _repo.getAppointmentTypes(),
      ]);
      if (!mounted) return;
      setState(() {
        _specialists = results[0];
        _appointmentTypes = results[1];
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'No se pudieron cargar los datos.';
        _isLoading = false;
      });
    }
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now.add(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(primary: AppTheme.primaryColor),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(primary: AppTheme.primaryColor),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  Future<void> _submit() async {
    if (_selectedSpecialist == null ||
        _selectedAppointmentType == null ||
        _selectedDate == null ||
        _selectedTime == null) {
      setState(() => _errorMessage = 'Completá todos los pasos.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final fechaHora = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );
      final fechaHoraFin = fechaHora.add(const Duration(minutes: 30));

      await _repo.scheduleAppointment(
        idEspecialista: _selectedSpecialist!['id_especialista'] as int,
        idTipoCita: _selectedAppointmentType!['id_tipo_cita'] as int,
        fechaHoraInicio: fechaHora.toIso8601String(),
        fechaHoraFin: fechaHoraFin.toIso8601String(),
        motivo: _motivoController.text.trim().isEmpty
            ? null
            : _motivoController.text.trim(),
      );

      if (!mounted) return;

      // Mostrar éxito
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text('¡Cita agendada!'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.check_circle_outline,
                color: Color(0xFF059669),
                size: 48,
              ),
              SizedBox(height: AppTheme.space3),
              Text(
                'Tu cita fue programada correctamente.',
                style: Theme.of(ctx).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              SizedBox(height: AppTheme.space2),
              Text(
                'Especialista: ${_selectedSpecialist!['nombre_completo']}',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              Text(
                'Fecha: ${DateFormat("EEEE d 'de' MMMM", 'es').format(fechaHora)}',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              Text(
                'Hora: ${_selectedTime!.format(context)}',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
            ],
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                context.go('/home');
              },
              child: const Text('Ir al inicio'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'No se pudo agendar la cita.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agendar cita'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFEFF6FF), Color(0xFFF8FAFC)],
          ),
        ),
        child: SafeArea(
          child: _isLoading && _specialists.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: EdgeInsets.all(AppTheme.space5),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Progress indicator
                      _StepIndicator(currentStep: _step),
                      SizedBox(height: AppTheme.space5),

                      if (_errorMessage != null)
                        Container(
                          padding: EdgeInsets.all(AppTheme.space3),
                          margin: EdgeInsets.only(bottom: AppTheme.space4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Text(
                            _errorMessage!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: const Color(0xFFB91C1C),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),

                      // Step 1: Specialist + Type
                      if (_step == 0) ...[
                        Text(
                          'Elegí especialista y tipo de cita',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: AppTheme.space4),
                        Semantics(
                          label: 'Seleccionar especialista',
                          child: DropdownButtonFormField<Map<String, dynamic>>(
                            initialValue: _selectedSpecialist,
                            decoration: const InputDecoration(
                              labelText: 'Especialista',
                              prefixIcon: Icon(Icons.person_outline_rounded),
                              border: OutlineInputBorder(),
                            ),
                            items: _specialists
                                .map((s) => DropdownMenuItem<Map<String, dynamic>>(
                                      value: s,
                                      child: Text(
                                        '${s['nombre_completo']} — ${s['especialidad']}',
                                      ),
                                    ))
                                .toList(),
                            onChanged: (v) => setState(() => _selectedSpecialist = v),
                          ),
                        ),
                        SizedBox(height: AppTheme.space4),
                        Semantics(
                          label: 'Seleccionar tipo de cita',
                          child: DropdownButtonFormField<Map<String, dynamic>>(
                            initialValue: _selectedAppointmentType,
                            decoration: const InputDecoration(
                              labelText: 'Tipo de cita',
                              prefixIcon: Icon(Icons.category_outlined),
                              border: OutlineInputBorder(),
                            ),
                            items: _appointmentTypes
                                .map((t) => DropdownMenuItem<Map<String, dynamic>>(
                                      value: t,
                                      child: Text(
                                        t['nombre_display'] as String? ?? t['nombre'] as String,
                                      ),
                                    ))
                                .toList(),
                            onChanged: (v) => setState(() => _selectedAppointmentType = v),
                          ),
                        ),
                        SizedBox(height: AppTheme.space5),
                        Semantics(
                          label: 'Botón para continuar al siguiente paso',
                          button: true,
                          child: SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: (_selectedSpecialist != null &&
                                      _selectedAppointmentType != null)
                                  ? () => setState(() => _step = 1)
                                  : null,
                              style: FilledButton.styleFrom(
                                minimumSize: const Size(double.infinity, 48),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: const Text('Continuar'),
                            ),
                          ),
                        ),
                      ],

                      // Step 2: Date + Time
                      if (_step == 1) ...[
                        Text(
                          'Elegí fecha y hora',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: AppTheme.space4),
                        Semantics(
                          label: 'Seleccionar fecha para la cita',
                          button: true,
                          child: OutlinedButton.icon(
                            onPressed: _selectDate,
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 48),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            icon: const Icon(Icons.calendar_today_outlined),
                            label: Text(
                              _selectedDate != null
                                  ? DateFormat("EEEE d 'de' MMMM 'de' y", 'es')
                                      .format(_selectedDate!)
                                  : 'Seleccionar fecha',
                            ),
                          ),
                        ),
                        SizedBox(height: AppTheme.space3),
                        Semantics(
                          label: 'Seleccionar hora para la cita',
                          button: true,
                          child: OutlinedButton.icon(
                            onPressed: _selectTime,
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 48),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            icon: const Icon(Icons.schedule),
                            label: Text(
                              _selectedTime != null
                                  ? _selectedTime!.format(context)
                                  : 'Seleccionar hora',
                            ),
                          ),
                        ),
                        SizedBox(height: AppTheme.space4),
                        Semantics(
                          label: 'Motivo opcional de la cita',
                          child: TextField(
                            controller: _motivoController,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Motivo (opcional)',
                              hintText: 'Describí brevemente el motivo de tu consulta',
                              prefixIcon: Icon(Icons.notes_outlined),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        SizedBox(height: AppTheme.space5),
                        Row(
                          children: [
                            Expanded(
                              child: Semantics(
                                label: 'Botón para volver al paso anterior',
                                button: true,
                                child: OutlinedButton(
                                  onPressed: () => setState(() => _step = 0),
                                  style: OutlinedButton.styleFrom(
                                    minimumSize: const Size(0, 48),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: const Text('Atrás'),
                                ),
                              ),
                            ),
                            SizedBox(width: AppTheme.space3),
                            Expanded(
                              child: Semantics(
                                label: 'Botón para continuar al siguiente paso',
                                button: true,
                                child: FilledButton(
                                  onPressed: (_selectedDate != null && _selectedTime != null)
                                      ? () => setState(() => _step = 2)
                                      : null,
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size(0, 48),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: const Text('Continuar'),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],

                      // Step 3: Confirm
                      if (_step == 2) ...[
                        Text(
                          'Confirmar cita',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: AppTheme.space4),
                        _SummaryCard(
                          specialist: _selectedSpecialist!,
                          appointmentType: _selectedAppointmentType!,
                          date: _selectedDate!,
                          time: _selectedTime!,
                          motivo: _motivoController.text.trim(),
                        ),
                        SizedBox(height: AppTheme.space5),
                        Row(
                          children: [
                            Expanded(
                              child: Semantics(
                                label: 'Botón para volver al paso anterior',
                                button: true,
                                child: OutlinedButton(
                                  onPressed: () => setState(() => _step = 1),
                                  style: OutlinedButton.styleFrom(
                                    minimumSize: const Size(0, 48),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: const Text('Atrás'),
                                ),
                              ),
                            ),
                            SizedBox(width: AppTheme.space3),
                            Expanded(
                              child: Semantics(
                                label: 'Botón para confirmar y agendar la cita',
                                button: true,
                                child: FilledButton(
                                  onPressed: _isLoading ? null : _submit,
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size(0, 48),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text('Confirmar cita'),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.currentStep});

  final int currentStep;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (int i = 0; i < 3; i++) ...[
          Expanded(
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: i <= currentStep ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          if (i < 2) SizedBox(width: AppTheme.space2),
        ],
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.specialist,
    required this.appointmentType,
    required this.date,
    required this.time,
    this.motivo,
  });

  final Map<String, dynamic> specialist;
  final Map<String, dynamic> appointmentType;
  final DateTime date;
  final TimeOfDay time;
  final String? motivo;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final typeLabel =
        appointmentType['nombre_display'] as String? ?? appointmentType['nombre'] as String;

    return Container(
      padding: EdgeInsets.all(AppTheme.space4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Resumen de la cita',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: AppTheme.primaryColor,
            ),
          ),
          SizedBox(height: AppTheme.space3),
          _SummaryRow(
            icon: Icons.person_outline_rounded,
            label: 'Especialista',
            value: '${specialist['nombre_completo']} — ${specialist['especialidad']}',
          ),
          SizedBox(height: AppTheme.space2),
          _SummaryRow(
            icon: Icons.category_outlined,
            label: 'Tipo',
            value: typeLabel,
          ),
          SizedBox(height: AppTheme.space2),
          _SummaryRow(
            icon: Icons.calendar_today_outlined,
            label: 'Fecha',
            value: DateFormat("EEEE d 'de' MMMM 'de' y", 'es').format(date),
          ),
          SizedBox(height: AppTheme.space2),
          _SummaryRow(
            icon: Icons.schedule,
            label: 'Hora',
            value: time.format(context),
          ),
          if (motivo != null && motivo!.isNotEmpty) ...[
            SizedBox(height: AppTheme.space2),
            _SummaryRow(
              icon: Icons.notes_outlined,
              label: 'Motivo',
              value: motivo!,
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppTheme.textMuted),
        SizedBox(width: AppTheme.space2),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                value,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

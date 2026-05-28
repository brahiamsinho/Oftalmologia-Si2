import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/auth_repository.dart';
import '../providers/session_notifier.dart';

class TenantWorkspaceScreen extends ConsumerStatefulWidget {
  const TenantWorkspaceScreen({super.key});

  @override
  ConsumerState<TenantWorkspaceScreen> createState() => _TenantWorkspaceScreenState();
}

class _TenantWorkspaceScreenState extends ConsumerState<TenantWorkspaceScreen> {
  final _slugController = TextEditingController();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _tenantPreview;

  @override
  void dispose() {
    _slugController.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    final slug = _slugController.text.trim().toLowerCase();
    if (slug.isEmpty) {
      setState(() => _error = 'Ingresá el slug de tu clínica.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _tenantPreview = null;
    });

    try {
      final tenant = await ref.read(authRepositoryProvider).lookupTenantBySlug(slug);
      await ref.read(sessionNotifierProvider.notifier).selectTenantSlug(slug);
      if (!mounted) return;
      setState(() => _tenantPreview = tenant);
      context.go('/login');
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Ingresa tu clínica',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Primero identifica tu workspace (slug). Luego inicias sesión.',
                        style: TextStyle(color: Colors.black54),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _slugController,
                        enabled: !_loading,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _continue(),
                        decoration: const InputDecoration(
                          labelText: 'Slug de clínica',
                          hintText: 'clinica-demo',
                          prefixIcon: Icon(Icons.business),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_error != null)
                        Text(
                          _error!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      if (_tenantPreview != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          'Clínica: ${_tenantPreview!['nombre'] ?? _slugController.text}',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _continue,
                          child: _loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Continuar'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

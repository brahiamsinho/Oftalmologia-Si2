import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Guarda el export en caché temporal y abre el diálogo de compartir del SO.
Future<void> saveAndShareReportFile({
  required List<int> bytes,
  required String filename,
}) async {
  final dir = await getTemporaryDirectory();
  final safeName = filename.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
  final file = File('${dir.path}/$safeName');
  await file.writeAsBytes(bytes, flush: true);
  await Share.shareXFiles(
    [XFile(file.path, name: safeName)],
    text: 'Reporte Oftalmología Si2',
  );
}

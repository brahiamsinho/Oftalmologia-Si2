import 'package:equatable/equatable.dart';

/// Payload QBE compatible con el backend.
class QbePayload extends Equatable {
  const QbePayload({
    required this.model,
    required this.filters,
    this.fields,
    this.orderBy = const [],
  });

  final String model;
  final Map<String, dynamic> filters;
  final List<String>? fields;
  final List<String> orderBy;

  Map<String, dynamic> toJson() => {
        'model': model,
        'filters': filters,
        if (fields != null && fields!.isNotEmpty) 'fields': fields,
        'order_by': orderBy,
      };

  factory QbePayload.fromJson(Map<String, dynamic> json) {
    final rawFilters = json['filters'];
    return QbePayload(
      model: json['model'] as String? ?? '',
      filters: rawFilters is Map
          ? Map<String, dynamic>.from(rawFilters)
          : <String, dynamic>{},
      fields: (json['fields'] as List?)?.map((e) => e.toString()).toList(),
      orderBy: (json['order_by'] as List?)?.map((e) => e.toString()).toList() ??
          const [],
    );
  }

  QbePayload copyWith({
    Map<String, dynamic>? filters,
  }) {
    return QbePayload(
      model: model,
      filters: filters ?? this.filters,
      fields: fields,
      orderBy: orderBy,
    );
  }

  @override
  List<Object?> get props => [model, filters, fields, orderBy];
}

class ReportMeta extends Equatable {
  const ReportMeta({
    required this.columns,
    required this.totalRecords,
    this.model,
    this.truncated = false,
  });

  final List<String> columns;
  final int totalRecords;
  final String? model;
  final bool truncated;

  factory ReportMeta.fromJson(Map<String, dynamic> json) {
    final meta = json['meta'] is Map
        ? Map<String, dynamic>.from(json['meta'] as Map)
        : json;
    return ReportMeta(
      columns: (meta['columns'] as List?)?.map((e) => e.toString()).toList() ??
          const [],
      totalRecords: meta['total_records'] as int? ?? 0,
      model: meta['model'] as String?,
      truncated: meta['truncated'] as bool? ?? false,
    );
  }

  @override
  List<Object?> get props => [columns, totalRecords, model, truncated];
}

class NlpToReportResult extends Equatable {
  const NlpToReportResult({
    required this.qbe,
    required this.columns,
    required this.rows,
    required this.meta,
    this.exportFormats = const [],
  });

  final QbePayload qbe;
  final List<String> columns;
  final List<Map<String, dynamic>> rows;
  final ReportMeta meta;
  final List<String> exportFormats;

  @override
  List<Object?> get props => [qbe, columns, rows, meta, exportFormats];
}

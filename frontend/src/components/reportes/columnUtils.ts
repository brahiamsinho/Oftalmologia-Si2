/** Columnas típicamente técnicas (IDs / FKs) que ocultamos por defecto en reportes. */
export function isTechnicalColumn(name: string): boolean {
  return name === 'id' || name.endsWith('_id');
}

/** Columnas que deben mostrarse por defecto (excluye técnicas). */
export function filterTechnicalColumns(allColumns: string[]): string[] {
  return allColumns.filter((c) => !isTechnicalColumn(c));
}

export function buildDefaultVisibility(allColumns: string[]): Record<string, boolean> {
  const v: Record<string, boolean> = {};
  for (const c of allColumns) {
    v[c] = !isTechnicalColumn(c);
  }
  return v;
}

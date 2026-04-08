/**
 * Format case number for display: Case_000001, Case_000002, etc.
 * Falls back to first 8 chars of id when case_number is missing (run ADD_CASE_NUMBER.sql).
 */
export function formatCaseNumber(
  n: number | null | undefined,
  idFallback?: string | null
): string {
  if (n != null && typeof n === 'number') {
    return `Case_${String(n).padStart(6, '0')}`;
  }
  if (idFallback && typeof idFallback === 'string') {
    return `Case_${idFallback.replace(/-/g, '').slice(0, 8)}`;
  }
  return '—';
}

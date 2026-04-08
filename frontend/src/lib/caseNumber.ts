/**
 * Format case number for display: Case_000001, Case_000002, etc.
 */
export function formatCaseNumber(n: number | null | undefined): string {
  if (n == null || typeof n !== 'number') return '—';
  return `Case_${String(n).padStart(6, '0')}`;
}

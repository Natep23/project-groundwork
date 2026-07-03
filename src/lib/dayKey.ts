/* Client-local calendar day as "YYYY-MM-DD".
 *
 * Backend action mutations (addCard/changePhase/moveCard/…) accept this to
 * stamp events for the heatmap and drive streak advancement. It must reflect
 * the user's *local* day, not UTC, so a late-night action counts toward the
 * right day. */
export function localDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

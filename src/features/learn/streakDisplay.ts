/**
 * Compact streak formatting for tight stat tiles: day counts read as "12d",
 * month-scale streaks as "1m" / "2m" (30-day months, floored). The full
 * "N days" belongs in the hover tooltip, not the tile.
 */
export function compactStreak(days: number): { value: number; unit: "d" | "m" } {
  if (days >= 30) return { value: Math.floor(days / 30), unit: "m" };
  return { value: Math.max(0, days), unit: "d" };
}

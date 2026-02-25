/**
 * Daily reminder time: stored as UTC "HH:mm", displayed in local time.
 * Uses a fixed reference date (Jan 1, 2000) for conversion.
 */

/**
 * Convert UTC "HH:mm" to local "HH:mm" for display (24h format).
 */
export function utcToLocalHHmm(utcHHmm: string): string {
  const [h, m] = utcHHmm.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h ?? 0, m ?? 0));
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Convert local "HH:mm" (user's pick) to UTC "HH:mm" for storage.
 */
export function localToUtcHHmm(localHHmm: string): string {
  const [h, m] = localHHmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h ?? 0, m ?? 0);
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

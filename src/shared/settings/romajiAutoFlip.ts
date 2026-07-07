import type { UserSettings } from "./types";

/**
 * Per-script modules at which the romaji reading aid auto-disables. By
 * Module 10 the learner reads hiragana fluently through the grammar spine;
 * katakana is taught gradually (M3→~M12) so its aid retires later, at
 * Module 17. Two thresholds, one user-facing `showRomaji` toggle.
 */
export const HIRAGANA_ROMAJI_OFF_MODULE = 10;
export const KATAKANA_ROMAJI_OFF_MODULE = 17;

/**
 * The module at which character-build tile banks stop showing per-kana
 * romaji by default and switch to tap/hover-to-reveal. Earlier than the
 * full romaji auto-off (Module 15): by ~10h of study a learner can read
 * kana, so the spelling tiles shouldn't keep handing them the answer,
 * even while romaji still aids elsewhere. (Spencer 2026-06-13.)
 */
export const BUILD_TILE_ROMAJI_FADE_MODULE = 10;

/**
 * Decide whether the character-build romaji should auto-fade for this
 * learner. Mirrors the per-script romaji auto-off but keyed on its own one-shot
 * guard (`buildTileRomajiAutoFlipped`) and earlier module threshold, and
 * INDEPENDENT of `showRomaji` — build tiles fade first while romaji can
 * stay on everywhere else.
 *
 * Pure decision function — callers handle the `updateSetting` writes.
 */
export function shouldAutoFadeBuildTileRomaji(opts: {
  settings: UserSettings;
  reachedModuleIndex: number;
}): boolean {
  const { hideBuildTileRomaji, buildTileRomajiAutoFlipped } =
    opts.settings.learning;
  // Already faded, or the auto-flip already fired once → user-controlled.
  if (hideBuildTileRomaji || buildTileRomajiAutoFlipped) return false;
  return opts.reachedModuleIndex >= BUILD_TILE_ROMAJI_FADE_MODULE;
}

export type KanaScript = "hiragana" | "katakana";

/**
 * Decide whether to flip a given script's one-time romaji auto-off guard.
 * True only when that guard isn't already set AND the learner has reached
 * the script's off-module. Pure — the caller writes the setting + toast.
 *
 * There is no longer an "alphabet-mastered" global kill: the per-script
 * module thresholds are the single source of truth, so passing the
 * katakana trainer test can't silently kill hiragana romaji.
 */
export function shouldAutoOffScriptRomaji(opts: {
  settings: UserSettings;
  reachedModuleIndex: number;
  script: KanaScript;
}): boolean {
  const { hiraganaRomajiAutoOff, katakanaRomajiAutoOff } =
    opts.settings.learning;
  if (opts.script === "hiragana") {
    if (hiraganaRomajiAutoOff) return false;
    return opts.reachedModuleIndex >= HIRAGANA_ROMAJI_OFF_MODULE;
  }
  if (katakanaRomajiAutoOff) return false;
  return opts.reachedModuleIndex >= KATAKANA_ROMAJI_OFF_MODULE;
}

/**
 * Pure render-gate decision: should romaji show for a kana of `script`?
 * The `showRomaji` master toggle gates both scripts; the per-script
 * auto-off guard hides that script once crossed; `romajiOnForDay === today`
 * forces romaji back on for every script (the "for today" escape hatch).
 */
export function romajiVisibleForScript(opts: {
  settings: UserSettings;
  script: KanaScript;
  today: string;
}): boolean {
  const l = opts.settings.learning;
  if (l.romajiOnForDay && l.romajiOnForDay === opts.today) return true;
  if (!(l.showRomaji ?? true)) return false;
  const off =
    opts.script === "katakana"
      ? l.katakanaRomajiAutoOff
      : l.hiraganaRomajiAutoOff;
  return !off;
}

/** Local calendar date (YYYY-MM-DD) for the "romaji for today" escape hatch. */
export function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Parse a module index from a Lingo lesson or module ID. Supports the
 * `ja-m{N}` and `ja-m{N}-*` conventions used in `mockCourse.ts`.
 * Returns 0 for unrecognized IDs (sidequests, recap nodes, etc.) so the
 * trigger check naturally no-ops on those.
 */
export function parseModuleIndex(id: string | undefined): number {
  if (!id) return 0;
  const match = id.match(/^(?:ja|ko)-m(\d+)(?:[-]|$)/);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : 0;
}

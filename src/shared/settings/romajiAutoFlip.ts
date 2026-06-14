import type { UserSettings } from "./types";

/**
 * The module number at which the romaji reading aid auto-disables. By
 * Module 15 the learner has demonstrated enough kana fluency through the
 * grammar spine that the crutch becomes counterproductive.
 */
export const ROMAJI_AUTO_OFF_MODULE = 15;

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
 * learner. Mirrors `shouldAutoFlipRomaji` but keyed on its own one-shot
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

export type RomajiAutoFlipReason = "module-reached" | "alphabet-mastered";

export type RomajiAutoFlipResult = {
  /** True when the helper actually flipped the setting. False = no-op. */
  flipped: boolean;
  /** Reason the flip fired (or would have fired). Undefined when no-op. */
  reason?: RomajiAutoFlipReason;
};

/**
 * Decide whether the romaji reading aid should auto-disable for this
 * learner. Returns `flipped: true` only when:
 *   1. `showRomaji` is currently on, AND
 *   2. `romajiAutoFlipped` has not yet fired, AND
 *   3. The trigger condition (Module 15+ reached OR alphabet mastered)
 *      is now satisfied.
 *
 * Pure decision function — callers handle the actual `updateSetting`
 * writes + any toast UX.
 */
export function shouldAutoFlipRomaji(opts: {
  settings: UserSettings;
  trigger: RomajiAutoFlipReason;
  /** Reached module index (1-based). Only consulted for "module-reached". */
  reachedModuleIndex?: number;
  /** Has the learner passed the full alphabet test for hiragana or
   *  katakana? Only consulted for "alphabet-mastered". */
  alphabetFullTestPassed?: boolean;
}): RomajiAutoFlipResult {
  const { showRomaji, romajiAutoFlipped } = opts.settings.learning;

  // If the learner has already had the flip happen once, or romaji is
  // already off, there's nothing to do — they're in user-controlled
  // territory now.
  if (!showRomaji || romajiAutoFlipped) {
    return { flipped: false };
  }

  if (opts.trigger === "module-reached") {
    if ((opts.reachedModuleIndex ?? 0) >= ROMAJI_AUTO_OFF_MODULE) {
      return { flipped: true, reason: "module-reached" };
    }
    return { flipped: false };
  }

  if (opts.trigger === "alphabet-mastered") {
    if (opts.alphabetFullTestPassed) {
      return { flipped: true, reason: "alphabet-mastered" };
    }
    return { flipped: false };
  }

  return { flipped: false };
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

/**
 * Kanji-recognition rollout config (v1 — LIVE, owner-approved 2026-07-16).
 *
 * The whole kanji surface layer keys off two numbers so the policy is a
 * one-place edit, never a content change. This file is the single source of
 * truth for the owner's "reading ladder":
 *
 *   romaji dies at m7   →   kanji RECOGNITION begins at m8   →   furigana
 *   comes off each kanji two modules after it unlocks (unlock+2).
 *
 * Concretely, for a learner and a kanji that unlocks at module N:
 *   - modules 1‑7          no kanji at all (kana-acquisition phase; hard floor)
 *   - module  N (>= 8)     kanji surface appears WITH furigana
 *   - module  N+1          kanji surface WITH furigana (still inside window)
 *   - module  N+2 onward   kanji surface, furigana OFF ("reads cold")
 *
 * So an m8-unlocked kanji (numbers 一二三…) shows furigana in m8 and m9, then
 * reads bare from m10 — the owner's "production" bar. Reviews inherit this
 * automatically: an m10 review of m8 vocab shows the kanji with no furigana,
 * while an m10 review of m9 vocab (window m9‑m10) still shows furigana.
 *
 * NOTE ON SUPERSEDING THE SPEC: the scoping spec
 * (docs/kanji-implementation-spec-2026-07-16.md) proposed a single
 * `KANJI_START_MODULE = 99` OFF sentinel to ship the pass as a proven no-op
 * while a pilot module was chosen. The owner instead approved shipping LIVE
 * from m8 with a rolling furigana window (per-word mastery fade is explicitly
 * v2 — no mastery store here). `KANJI_RECOGNITION_MODULE` below is the live
 * floor; there is no OFF sentinel.
 *
 * The per-kanji UNLOCK module is NOT configured here — it is derived from the
 * `N5_KANJI` anchorVocab schedule (m8‑22) in `applyKanjiSurfaces.ts`, gated on
 * the MAX of a multi-kanji word's component `introducedAtModule`. This file
 * only carries the global floor + the window width.
 */

/**
 * First module at which any kanji surface may appear. Below this, the pass is
 * a hard no-op (m1‑7 kana-acquisition floor). All `N5_KANJI` schedule unlocks
 * are already >= 8, so this is both the floor and a structural guarantee that
 * nothing kanji-ifies during kana acquisition.
 */
export const KANJI_RECOGNITION_MODULE = 8;

/**
 * Furigana window width, in modules. A kanji that unlocks at module N keeps
 * furigana while `learnerModule < N + FURIGANA_WINDOW`, i.e. for modules N and
 * N+1, and reads bare (furigana off) from module N+2 onward.
 *
 * Owner's ladder: "furigana off at unlock+2" ⇒ window = 2. Widening this is a
 * one-line policy change; per-word mastery-linked fade is a separate v2
 * workstream (see doc comment above) and deliberately not modeled here.
 */
export const FURIGANA_WINDOW = 2;

/**
 * True when a kanji that unlocked at `unlockModule` should still render its
 * furigana for a learner currently at `learnerModule`. Centralized so the
 * pass and its tests agree on the exact window arithmetic.
 */
export function furiganaVisibleAt(
  learnerModule: number,
  unlockModule: number,
): boolean {
  return learnerModule < unlockModule + FURIGANA_WINDOW;
}

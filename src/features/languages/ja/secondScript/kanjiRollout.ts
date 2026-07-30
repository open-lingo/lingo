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

/**
 * SWITCHOVER BEAT (B061, 2026-07-29). The kana→kanji introduction: an animated
 * `kanji_reveal` step followed by a graded kanji cloze, promoted to the FRONT of
 * a dynamic review lesson when a word is ready.
 *
 * Set false to take the whole feature out in one line — the beat stops being
 * offered AND `applyKanjiSurfaces`' output stops being latch-gated, so rendering
 * reverts exactly to the module-only ladder above. Kept as a constant beside the
 * other two numbers for the same reason they are here: this is policy, and policy
 * should be a one-place edit rather than a content change.
 */
export const SWITCHOVER_BEAT_ENABLED = true;

/**
 * RETIRED 2026-07-29 — kept only to document why an FSRS-interval trigger was
 * dropped, because "just require N days of interval" is the obvious idea and it
 * does not work.
 *
 * Measured, reviewing strictly on schedule from a fresh card:
 *
 *   all-Good:  rep1 0d → rep2 5d → rep3 28d → rep4 102d
 *   all-Easy:  rep1 9d → rep2 77d → rep3 420d
 *   all-Hard:  0d forever
 *
 * Two consequences killed the idea. First, **7 days and 14 days are the same
 * trigger** — both are crossed at rep 3, because FSRS jumps 5d→28d and steps
 * clean over the whole range. Tuning the threshold buys nothing. Second, a learner
 * who answers Hard never reaches ANY threshold, so the shakiest learners would
 * never be shown a kanji at all, which is the opposite of what a reading ladder
 * should do.
 *
 * Spencer's call: use the MODULE as the trigger (predictable, and the research
 * pass found learner complaints track unpredictability rather than difficulty),
 * and let the graded cloze — not the schedule — decide whether it sticks.
 */
export const RETIRED_KANJI_REVEAL_INTERVAL_DAYS = 14;

/**
 * Failed beats a word gets before it latches anyway.
 *
 * Spencer 2026-07-29: *"it should unlock immediately UNLESS they get the kanji
 * question wrong, then it will stay kana and then show them the card one more
 * time in reviews."*
 *
 * One retry, not unlimited: a learner who keeps missing one word would otherwise
 * hold a beat slot forever and keep that word in kana for the rest of the course.
 * After the retry the word latches regardless — it has now had two introductions
 * and two graded attempts, which is more than any other word in the course gets.
 */
export const MAX_SWITCHOVER_MISSES = 1;

/**
 * Switchover beats offered per dynamic review lesson.
 *
 * Two, not one, because the queue has to DRAIN. Measured 2026-07-29: 124
 * switchover words against **66 review lessons at m8+** (3 per module, m8–m29).
 * At one beat per review, 58 words could never be introduced at all — and since
 * the render gate withholds an un-introduced kanji, those words would stay kana
 * permanently, which is strictly worse than the silent switch this feature exists
 * to remove. Two beats gives 132 slots against 124 words, and ~6 per module
 * against ~5.6 newly-eligible per module, so it keeps pace rather than falling
 * behind.
 *
 * Each beat is 2 steps, so this caps the beat's cost at 4 steps on a review that
 * otherwise runs ~18 atoms plus grammar.
 */
export const MAX_SWITCHOVER_BEATS_PER_REVIEW = 2;

/**
 * FAIL-OPEN: modules past unlock after which a word's kanji renders whether or
 * not its beat ever fired.
 *
 * Non-negotiable safety valve, not a tuning knob. The render gate withholds kanji
 * until the beat introduces it, which means any word the queue fails to reach —
 * a learner who skips reviews, a straggler at the end of the backlog, a future
 * regression in the selector — would be stuck in kana for the rest of the course.
 * Silently never showing a kanji is a worse failure than showing it without
 * ceremony, so after this many modules the old module-gated behaviour resumes.
 *
 * FIVE, sized from the measured drain. Under the module trigger the backlog peaks
 * at 22 words after m22 (that module alone makes 22 words eligible at once) and
 * takes about four modules to clear at 6 slots per module. A grace of 3 would have
 * failed those words open BEFORE their beat ever ran, which defeats the feature
 * precisely where it is under most load.
 *
 * Furigana on a failed-open word is handled separately and correctly now: it rides
 * the LATCH DATE when there is one, and an un-latched word past its module window
 * keeps furigana while unmastered. See `furiganaVisibleForSwitchover`.
 */
export const SWITCHOVER_GRACE_MODULES = 5;

/**
 * Days of furigana a word keeps after its written form is INTRODUCED, measured
 * from the latch date rather than from the module.
 *
 * This is the B064 fix, and the module trigger alone does not cover it. On-time
 * introductions are fine — the beat fires at the unlock module, so
 * `furiganaVisibleAt(unlock, unlock)` is true and the module window already holds.
 * The hole is the BACKLOG: m22 makes 22 words eligible at once and takes ~4
 * modules to drain, so a word introduced at m26 is past its unlock+2 window on the
 * very first sentence after its own reveal. If it is also FSRS-mastered — likely,
 * for a word known since m1 — it appears BARE seconds after being introduced.
 *
 * 21 days ≈ three weeks of review traffic, which at the measured FSRS growth
 * (5d → 28d on rep 3) is a handful of scheduled reps on the word itself.
 */
export const FURIGANA_DAYS_AFTER_LATCH = 21;

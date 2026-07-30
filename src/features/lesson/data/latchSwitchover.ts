import type { LessonStep } from "../types";
import {
  latchKanji,
  recordSwitchoverMiss,
} from "@/features/languages/ja/secondScript/kanjiSwitchoverLatch";
import { MAX_SWITCHOVER_MISSES } from "@/features/languages/ja/secondScript/kanjiRollout";
import { getToday } from "@/features/flashcards/engine/srs";

/**
 * Latches the kana→kanji switchover a completed lesson introduced (B061).
 *
 * Called from `LessonPage`'s completion handler — the beat's write surface. It is
 * deliberately NOT a seventh SRS write surface: the latch is its own tiny store
 * (`kanjiSwitchoverLatch`), not an FSRS card, because a switchover must never
 * revert and FSRS state does.
 *
 * The pair is matched by step id suffix rather than by position: the reveal is
 * `<lesson>-kanji-reveal` and the cloze `<lesson>-kanji-cloze`, both emitted
 * together by `buildSwitchoverBeat`. Position would break the moment anything
 * else is prepended to a review.
 */
export function latchCompletedSwitchover(
  steps: LessonStep[],
  results: Record<string, boolean>,
): string[] {
  const latched: string[] = [];
  const today = getToday();
  for (const step of steps) {
    if (step.type !== "kanji_reveal" || !step.atomId) continue;
    // Pair by id, not by position: a review can carry up to
    // MAX_SWITCHOVER_BEATS_PER_REVIEW beats, and position would break the moment
    // anything else is prepended.
    const clozeId = step.id.replace("-kanji-reveal-", "-kanji-cloze-");
    const cloze = steps.find((s) => s.id === clozeId);
    // No cloze means no retrieval happened, so nothing was demonstrated.
    // `buildSwitchoverBeat` emits both or neither; this guards a future caller
    // emitting a lone reveal, not an expected state.
    if (!cloze) continue;
    const answer = results[cloze.id];
    // Never answered (abandoned lesson) — no evidence either way, leave it queued.
    if (answer === undefined) continue;

    if (answer === false) {
      // Spencer 2026-07-29: a miss keeps the word in kana and buys ONE more
      // introduction. Past that it latches anyway on this completion — a learner
      // who keeps missing one word would otherwise hold a beat slot forever and
      // keep that word in kana for the rest of the course.
      const misses = recordSwitchoverMiss(step.atomId);
      if (misses <= MAX_SWITCHOVER_MISSES) continue;
    }

    latchKanji(step.atomId, today);
    latched.push(step.atomId);
  }
  return latched;
}

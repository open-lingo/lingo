import { describe, it, expect, beforeEach } from "vitest";
import { buildSrsReviewLesson } from "./buildSrsReviewLesson";
import { latchCompletedSwitchover } from "./latchSwitchover";
import {
  isKanjiLatched,
  resetKanjiLatchStore,
} from "@/features/languages/ja/secondScript/kanjiSwitchoverLatch";
import { isSwitchoverAtom } from "@/features/languages/ja/secondScript/switchoverCandidate";
import { KANJI_ELIGIBLE_ATOMS } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { MAX_SWITCHOVER_BEATS_PER_REVIEW } from "@/features/languages/ja/secondScript/kanjiRollout";
import {
  setCardState,
  clearSRSStore,
} from "@/features/flashcards/engine/srsStorage";
import { createInitialState } from "@/features/flashcards/engine/srs";
import type { SRSCardState } from "@/features/flashcards/data/types";
import { unlockAtomIds } from "./unlockLessonAtoms";
import type { LessonStep } from "../types";

/**
 * End-to-end for the switchover beat (B061): does a dynamic review actually
 * promote a ready word to the front, and does completing it latch?
 *
 * The unit tests next to the selector cover the trigger. This covers the seam —
 * that the beat is emitted as a matched PAIR, that both halves reach the lesson,
 * and that the latch fires from step results the way `LessonPage` calls it.
 */

function ready(days: number): SRSCardState {
  const base = createInitialState();
  return {
    ...base,
    recognition: { ...base.recognition, interval: days, reps: 6 },
    production: { ...base.production, interval: days, reps: 6 },
  };
}

function switchoverIds(): string[] {
  return [...KANJI_ELIGIBLE_ATOMS.keys()].filter((id) => isSwitchoverAtom(id));
}

function build(moduleId: string) {
  return buildSrsReviewLesson({
    moduleId,
    position: 1,
    courseId: "ja-n5",
    languageId: "ja",
  });
}

const revealsIn = (steps: LessonStep[]) =>
  steps.filter((s) => s.type === "kanji_reveal");

beforeEach(() => {
  resetKanjiLatchStore();
  clearSRSStore();
});

describe("switchover beat inside a dynamic review", () => {
  it("emits no beat when nothing is ready", () => {
    // A learner with no mature vocabulary gets an ordinary review. The beat is
    // rare by construction — this is the common path, not an edge case.
    const lesson = build("m20");
    expect(revealsIn(lesson.steps)).toEqual([]);
  });

  it("promotes a ready word to the FRONT of the review", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));

    const lesson = build("m22");
    const reveals = revealsIn(lesson.steps);
    expect(reveals.length).toBeGreaterThan(0);
    expect(reveals.length).toBeLessThanOrEqual(MAX_SWITCHOVER_BEATS_PER_REVIEW);
    // Front, not tail: an introduction competing with fatigue after eight
    // retrievals is not an introduction. On the learner's FIRST-EVER switchover a
    // one-time explainer card leads; after that the reveal itself is step 0.
    expect(["kanji_reveal", "info"]).toContain(lesson.steps[0].type);
    const revealIdx = lesson.steps.findIndex((st) => st.type === "kanji_reveal");
    const reviewIntroIdx = lesson.steps.findIndex(
      (st) => st.type === "info" && st.id.endsWith("-info-start"),
    );
    expect(revealIdx).toBeLessThan(reviewIntroIdx);
  });

  it("emits every reveal with a matching cloze — never half a beat", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));

    const lesson = build("m22");
    for (const reveal of revealsIn(lesson.steps)) {
      const clozeId = reveal.id.replace("-kanji-reveal-", "-kanji-cloze-");
      const cloze = lesson.steps.find((s) => s.id === clozeId);
      expect(cloze, `no cloze for ${reveal.id}`).toBeDefined();
      expect(cloze!.type).toBe("fill_blank");
      // The cloze must not print the answer in its own frame.
      const shown = (cloze as { sentence: string }).sentence;
      expect(shown).toContain("{{blank}}");
      expect(shown).not.toContain((reveal as { kanji: string }).kanji);
      // ...and must hide the tile readings, or no kanji gets read.
      expect((cloze as { wordBankHideHelper?: boolean }).wordBankHideHelper).toBe(true);
      // The correct tile is the switched word, exactly once.
      const bank = (cloze as { wordBank: string[] }).wordBank;
      expect(bank).toHaveLength(4);
      expect(bank.filter((t) => t === (reveal as { kanji: string }).kanji)).toHaveLength(1);
    }
  });

  it("does not latch at BUILD time — construction stays pure", () => {
    // The one time this function wrote state during construction it seeded every
    // unlocked atom due-today on any course-deck build, because the sentence
    // miner materializes every lesson.
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));

    const lesson = build("m22");
    const reveals = revealsIn(lesson.steps);
    expect(reveals.length).toBeGreaterThan(0);
    for (const r of reveals) {
      expect(isKanjiLatched((r as { atomId: string }).atomId)).toBe(false);
    }
  });

  it("latches on completion when the cloze was CORRECT", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));
    const lesson = build("m22");
    const reveal = revealsIn(lesson.steps)[0] as { id: string; atomId: string };
    const clozeId = reveal.id.replace("-kanji-reveal-", "-kanji-cloze-");

    const latched = latchCompletedSwitchover(lesson.steps, { [clozeId]: true });
    expect(latched).toContain(reveal.atomId);
    expect(isKanjiLatched(reveal.atomId)).toBe(true);
  });

  it("does NOT latch when the cloze was wrong — the word is re-offered later", () => {
    // A wrong answer leaves the word in kana so the beat can be offered again,
    // rather than silently switching a form the learner just failed to recognise.
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));
    const lesson = build("m22");
    const reveal = revealsIn(lesson.steps)[0] as { id: string; atomId: string };
    const clozeId = reveal.id.replace("-kanji-reveal-", "-kanji-cloze-");

    expect(latchCompletedSwitchover(lesson.steps, { [clozeId]: false })).toEqual([]);
    expect(isKanjiLatched(reveal.atomId)).toBe(false);
  });

  it("does not latch a beat the learner never answered", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));
    const lesson = build("m22");
    expect(latchCompletedSwitchover(lesson.steps, {})).toEqual([]);
  });

  it("stops offering a word once it is latched", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));

    const first = build("m22");
    const firstIds = revealsIn(first.steps).map((r) => (r as { atomId: string }).atomId);
    expect(firstIds.length).toBeGreaterThan(0);
    for (const r of revealsIn(first.steps)) {
      const reveal = r as { id: string; atomId: string };
      latchCompletedSwitchover(first.steps, {
        [reveal.id.replace("-kanji-reveal-", "-kanji-cloze-")]: true,
      });
    }

    const second = build("m22");
    const secondIds = revealsIn(second.steps).map(
      (r) => (r as { atomId: string }).atomId,
    );
    // The queue advanced: no repeats, and the next words are different ones.
    for (const id of secondIds) expect(firstIds).not.toContain(id);
  });

  it("gives every beat step a unique id when two run in one review", () => {
    // Two beats in a lesson collided on `-kanji-reveal` before the per-word
    // suffix, which would have made the latch pair the wrong cloze.
    const ids = switchoverIds();
    unlockAtomIds(ids);
    for (const id of ids) setCardState(id, ready(40));
    const lesson = build("m22");
    const allIds = lesson.steps.map((s) => s.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

describe("module trigger (2026-07-29 — replaced the FSRS interval gate)", () => {
  it("fires with NO srs state at all — the module is the trigger", () => {
    // The retired 14-day gate meant a learner who answers Hard (interval stays 0
    // forever) would never be shown a kanji. Measured: all-Hard never grows, and
    // 7d vs 14d are the same trigger because FSRS steps 5d→28d over the range.
    const ids = switchoverIds();
    unlockAtomIds(ids);
    // deliberately no setCardState calls
    const lesson = build("m22");
    expect(revealsIn(lesson.steps).length).toBeGreaterThan(0);
  });

  it("still respects the module floor", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);
    const early = build("m8");
    for (const r of revealsIn(early.steps)) {
      const atomId = (r as { atomId: string }).atomId;
      expect(KANJI_ELIGIBLE_ATOMS.get(atomId)!.unlockModule).toBeLessThanOrEqual(8);
    }
  });
});

describe("miss → one retry → latch anyway", () => {
  function firstBeat(moduleId: string) {
    const lesson = build(moduleId);
    const reveal = revealsIn(lesson.steps)[0] as { id: string; atomId: string };
    return {
      lesson,
      reveal,
      clozeId: reveal.id.replace("-kanji-reveal-", "-kanji-cloze-"),
    };
  }

  it("keeps the word in kana on the first miss, then latches on the second", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);

    const a = firstBeat("m22");
    expect(latchCompletedSwitchover(a.lesson.steps, { [a.clozeId]: false })).toEqual([]);
    expect(isKanjiLatched(a.reveal.atomId)).toBe(false);

    // The retry is prompted: a missed word sorts to the front of the queue.
    const b = firstBeat("m22");
    expect(b.reveal.atomId).toBe(a.reveal.atomId);

    // Second miss: it latches anyway rather than holding a beat slot forever.
    expect(latchCompletedSwitchover(b.lesson.steps, { [b.clozeId]: false })).toContain(
      b.reveal.atomId,
    );
    expect(isKanjiLatched(b.reveal.atomId)).toBe(true);
  });
});

describe("the one-time explainer", () => {
  it("leads the learner's first-ever switchover, and never appears again", () => {
    const ids = switchoverIds();
    unlockAtomIds(ids);

    const first = build("m22");
    const intro = first.steps.find((st) => st.id.endsWith("-kanji-intro"));
    expect(intro, "expected a one-time intro card").toBeDefined();
    expect(first.steps[0].id).toBe(intro!.id);

    // Latch anything at all → the learner has had a switchover → no more card.
    for (const r of revealsIn(first.steps)) {
      const reveal = r as { id: string; atomId: string };
      latchCompletedSwitchover(first.steps, {
        [reveal.id.replace("-kanji-reveal-", "-kanji-cloze-")]: true,
      });
    }
    const second = build("m22");
    expect(revealsIn(second.steps).length).toBeGreaterThan(0);
    expect(second.steps.find((st) => st.id.endsWith("-kanji-intro"))).toBeUndefined();
  });
});

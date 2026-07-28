import { describe, expect, it } from "vitest";
import { getMockLessonContent, getAvailableMockLessonIds } from "./mockLessons";

/**
 * A bound ender is never a standalone production target.
 *
 * 「つもり」「ましょう」「でしょう」 attach to a preceding predicate. Asking the
 * learner to "Say: intend to" and expecting 「つもり」 asks for something no
 * one says in isolation.
 *
 * Found 2026-07-27 by scanning every compiled production target course-wide:
 * m23 shipped 「つもり」 twice and m24 shipped 「ましょう」 once, all as
 * `speaking` filler. None was authored — the filler generator draws from the
 * module's review pool, so any module registering a bound ender as an atom
 * shipped the step automatically. The fix is the `BOUND` list in
 * `moduleCompiler`; this is the ratchet that keeps it fixed.
 *
 * NOTE ON FIELD NAMES — the reason this test asserts it scanned something.
 * The first pass at this scan read `targetSentence` on `speaking` steps. That
 * field does not exist there; the field is `targetPhrase`. Every comparison
 * was therefore `undefined === "つもり"`, the scan reported a clean course,
 * and it was wrong. A checker that silently matches nothing looks exactly
 * like a checker that passes, so the counts below are asserted.
 */
const BOUND_ENDERS = [
  "つもり",
  "ましょう",
  "でしょう",
  "でしょ",
  "だろう",
  "かな",
  "たり",
];

/**
 * Every whole string the learner may be asked to produce for this step.
 *
 * The two production types keep the answer under DIFFERENT field names, and
 * neither is `targetSentence`: `speaking` uses `targetPhrase`, and `translate`
 * uses `acceptedAnswers` (a list, because grading is max-acceptance — every
 * correct rendering is accepted, so every one of them has to be checked).
 */
function productionTargets(step: unknown): string[] {
  const s = step as {
    type?: string;
    targetPhrase?: string;
    acceptedAnswers?: string[];
  };
  if (s.type === "speaking") return s.targetPhrase ? [s.targetPhrase] : [];
  if (s.type === "translate") return s.acceptedAnswers ?? [];
  return [];
}

describe("bound enders are never a standalone production target", () => {
  it("no lesson asks the learner to say a bare bound ender", () => {
    const offenders: string[] = [];
    let scanned = 0;

    for (const id of getAvailableMockLessonIds()) {
      if (!/^ja-m\d+-/.test(id)) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        for (const target of productionTargets(step)) {
          scanned++;
          const bare = target.replace(/[。、？！\s　]/g, "");
          if (BOUND_ENDERS.includes(bare)) {
            offenders.push(
              `${id}/${(step as { id: string }).id}: production target 「${target}」 is a bound ender`,
            );
          }
        }
      }
    }

    // Non-vacuity: if this drops to zero the scan has stopped seeing the
    // steps it is supposed to check, and its silence means nothing.
    expect(scanned, "scanned no production targets — the field names moved")
      .toBeGreaterThan(1000);
    expect(offenders).toEqual([]);
  });

  it("would catch a bare ender if one existed", () => {
    // Guards the matcher itself, not the content — including that it reads
    // BOTH field names, since reading one and missing the other is the exact
    // way this scan silently passed the first time.
    expect(productionTargets({ type: "speaking", targetPhrase: "つもり" })).toEqual(["つもり"]);
    expect(
      productionTargets({ type: "translate", acceptedAnswers: ["いく。", "いく"] }),
    ).toEqual(["いく。", "いく"]);
    expect(productionTargets({ type: "build_sentence" })).toEqual([]);
    expect(BOUND_ENDERS.includes("つもり".replace(/[。、？！\s　]/g, ""))).toBe(true);
    expect(BOUND_ENDERS.includes("たべる")).toBe(false);
  });
});

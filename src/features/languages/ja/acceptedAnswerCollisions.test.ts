/**
 * THE BACKSTOP FOR ACCEPTED-ANSWER WIDENING.
 *
 * Every rule in `jaAcceptedForms` / `translateVariants` makes the grader more
 * generous, and generosity has exactly one failure mode: a widening that is
 * too wide stops distinguishing two sentences the course deliberately teaches
 * apart. That failure is invisible in the rule's own unit tests — the rule
 * looks correct in isolation and only misbehaves against corpus it was never
 * shown.
 *
 * So this test asks the corpus, not the rule: expand EVERY typed-production
 * step in the course, and assert that no step's accepted set swallows a
 * DIFFERENT step's authored answer. Two authored sentences colliding means
 * the course draws a distinction the grader no longer sees.
 *
 * This is the guard to run before and after any widening sweep. A new rule
 * that adds a collision is too wide — narrow the rule; do not add an
 * exemption. The exemptions below are the register pairs alone, and the list
 * is a RATCHET: it may shrink, never grow.
 *
 * It has already earned its keep. The 2026-08-05 widening sweep — adjectives,
 * たい, past-negative, the fused copula, ん⇄の, じゃ⇄では — added ~90 accepted
 * answers across the course and ZERO new collision classes; the only entries
 * it forced were the mirror images of register pairs already exempt.
 */
import { describe, expect, it } from "vitest";
import { expandAcceptedAnswers } from "@/features/lesson/components/steps/translateVariants";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";

/** Whitespace and sentence punctuation are never load-bearing at grade time. */
const shape = (s: string) => s.replace(/[\s　。．.、]/g, "");

/**
 * Known, ACCEPTED collisions — every one is the register/copula machinery
 * doing exactly what Spencer asked it to do ("if people use polite form it
 * should be accepted", 2026-07-24; symmetric in both directions, 2026-08-05),
 * landing on a sentence another module happens to teach in the other
 * register. All are below REGISTER_GRADED_FROM_MODULE except the last, which
 * is the unconditional trailing-です drop.
 *
 * Keyed `<step>::<shape of swallowed answer>` — NOT the raw spelling. Keying
 * on the spelling made the ratchet brittle: the same collision re-reported
 * the moment a variant surfaced with its 。 attached instead of without.
 */
const ALLOWED_COLLISIONS = new Set(
  [
    // だ ⇄ です, taught plain in m3 and polite in m10 — both directions.
    "ja-m3-neo-2-tr-watashi::わたしは がくせいです",
    "ja-m10-neo-6-s-2::わたしは がくせいだ",
    // Dictionary ⇄ ます, taught plain in m5 and polite in m7 — both directions.
    "ja-m5-neo-3-tr-mizu::みずを のみます",
    "ja-m7-neo-1-s-2::みずを のむ",
    // The trailing-です drop, within one module.
    "ja-m22-neo-challenge-s-6::おなかが いたい",
    // て-request ⇄ てください, m8. WORTH KNOWING: unlike the pairs above,
    // these are minimal pairs inside ONE module — m8 authors 「Drink the
    // water」→のんで on L2 and 「Say politely: Please drink the water」→
    // のんでください on L4, so the module's own contrast is what goes ungraded
    // here, not two distant modules meeting by accident. Kept because it is
    // still register, m8 is below REGISTER_GRADED_FROM_MODULE, and the
    // symmetric ruling (2026-08-05) applies to register uniformly. Revisit
    // this pair first if that ruling is ever narrowed.
    "ja-m8-neo-10-s-2::みずを のんでください",
    "ja-m8-neo-4-s-3::みずを のんで",
    "ja-m8-neo-3-s-3::いえに きてください",
    "ja-m8-neo-9-s-1::いえに きて",
  ].map((e) => {
    const [step, answer] = e.split("::");
    return `${step}::${shape(answer)}`;
  }),
);

type TypedStep = { id: string; answers: string[]; moduleIndex: number | null };

function typedProductionSteps(): TypedStep[] {
  const steps: TypedStep[] = [];
  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson) continue;
    const m = /ja-m(\d+)/.exec(lesson.id)?.[1];
    for (const step of lesson.steps) {
      if (step.type !== "translate") continue;
      // `sourceLanguage: "native"` is the INTO-Japanese direction — the only
      // one the JA widening rules run on.
      if (step.sourceLanguage !== "native") continue;
      if (!step.acceptedAnswers?.length) continue;
      steps.push({
        id: step.id,
        answers: step.acceptedAnswers,
        moduleIndex: m ? Number(m) : null,
      });
    }
  }
  return steps;
}

describe("accepted-answer widening stays inside the course's distinctions", () => {
  it("no step's expansion swallows another step's authored answer", () => {
    const steps = typedProductionSteps();
    // The corpus is the oracle — a real sentence the course teaches elsewhere
    // is the sharpest possible probe for "is this rule too wide?".
    expect(steps.length).toBeGreaterThan(400);

    const authoredBy = new Map<string, string>();
    for (const s of steps) authoredBy.set(shape(s.answers[0]), s.id);

    const collisions: string[] = [];
    for (const s of steps) {
      const own = shape(s.answers[0]);
      for (const variant of expandAcceptedAnswers(s.answers, {
        moduleIndex: s.moduleIndex,
      })) {
        const key = shape(variant);
        if (key === own) continue;
        const owner = authoredBy.get(key);
        if (!owner || owner === s.id) continue;
        const signature = `${s.id}::${key}`;
        if (ALLOWED_COLLISIONS.has(signature)) continue;
        collisions.push(`${s.id} ("${s.answers[0]}") now accepts ${owner}'s "${variant}"`);
      }
    }
    expect([...new Set(collisions)]).toEqual([]);
  });

  /**
   * The ratchet. An exemption that stops colliding must be DELETED, or the
   * list slowly becomes a licence for the next too-wide rule to hide in.
   */
  it("keeps no stale exemptions", () => {
    const steps = typedProductionSteps();
    const authored = new Set(steps.map((s) => shape(s.answers[0])));
    const live = new Set<string>();
    for (const s of steps) {
      for (const variant of expandAcceptedAnswers(s.answers, {
        moduleIndex: s.moduleIndex,
      })) {
        const signature = `${s.id}::${shape(variant)}`;
        if (ALLOWED_COLLISIONS.has(signature) && authored.has(shape(variant))) {
          live.add(signature);
        }
      }
    }
    expect([...ALLOWED_COLLISIONS].filter((e) => !live.has(e))).toEqual([]);
  });
});

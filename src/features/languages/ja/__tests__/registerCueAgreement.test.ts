/**
 * REGISTER-CUE AGREEMENT GATE.
 *
 * A production step's cue tells the learner which form to produce —
 * "Say politely" wants ます, "Say to a friend" wants the plain form. The cue
 * is now structured data on the step (`data/registerCue.ts`), so it can be
 * checked against the sentence it is a cue FOR:
 *
 *   cue.form  vs  derivePoliteness(the authored Japanese)
 *
 * A mismatch is a content bug, not a rendering one: the learner is told
 * "politely" and graded against 「たべる」. Grading is untouched by this gate
 * (the accepted answer is still the authored Japanese) — the gate's whole
 * job is to say which sentences and cues disagree.
 *
 * SHAPED AS A RATCHET, the way `buildAnswerFloor.test.ts` is, because a
 * disagreement is authored content and closing one means re-deciding a
 * sentence's register or its cue — authoring work, per this repo's hard
 * rule, not a mechanical sweep. The per-module budget is what makes that
 * safe to hand to a lane: no NEW disagreement can be authored anywhere, a
 * module absent from the map must be at zero, and every number only ever
 * goes down.
 *
 * The 2026-09-15 baseline came in at ZERO across all 978 cued steps, so the
 * ratchet starts at the floor and there is nothing to pay down. The shape is
 * kept anyway: it is what a future lane needs if a real disagreement ever
 * lands, and it is the difference between a gate that reports and a gate
 * that blocks.
 *
 * Baseline measured 2026-09-15 against the compiled course
 * (`getMockLessonContent`, i.e. after every load-time pass).
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import { derivePoliteness, parseRegisterCue } from "@/features/lesson/data/registerCue";

/**
 * module → number of cue/sentence disagreements allowed.
 *
 * EMPTY, and measured that way: the 2026-09-15 sweep of all 978 cued steps
 * found ZERO disagreements. (It found one before the detector understood
 * backchannels — 「はい、はい。」 cued "Say politely", where はい IS the polite
 * form and the trailing い was being read as an い-adjective. That was a
 * detector bug, not an authoring bug; see `POLITE_INTERJECTION` in
 * `data/registerCue.ts`.)
 *
 * So the ratchet here starts at the floor. Nothing to pay down — the gate's
 * job is to keep it there, which is why a module absent from this map must
 * be at zero.
 */
const DISAGREEMENT_BUDGET: Readonly<Record<string, number>> = {};

/** The one number to watch. Sum of the budget above. */
const DISAGREEMENT_TOTAL_BUDGET = 0;

/**
 * Cued steps whose produced Japanese has NO derivable register (2026-09-15).
 *
 * Not failures, and each was read: m7's vocative 「たなかさま」, m17/m19/m20's
 * noun-final questions (「これは だれの かばん？」「えきは どこ？」「この
 * かばんは いくら？」 — a noun-final question carries no politeness marker in
 * either direction), and m10/m29's trailing-off refusals (「きょうは
 * ちょっと」, 「すみません ばんは ちょっと」 — the whole point is that the
 * predicate is left unsaid).
 *
 * Frozen as a budget for the same reason the disagreement count is: the
 * indeterminate class is the one place a real disagreement could hide, so it
 * is not allowed to grow quietly. A NEW indeterminate is either a sentence
 * whose register genuinely cannot be read (add it here, with the reading)
 * or a gap in `derivePoliteness` (fix the detector).
 */
const INDETERMINATE_BUDGET = 11;

type Finding = {
  module: string;
  lesson: string;
  id: string;
  label: string;
  claimed: string;
  derived: string;
  ja: string;
};

/**
 * The Japanese the learner is asked to PRODUCE for this step — the thing a
 * register cue is a cue for.
 *
 * `particle_cloze` uses the assembled sentence (`audioText`), not the bare
 * answer: a one-particle answer has no register, and the register of a
 * sentence is its final predicate.
 */
function producedJa(step: LessonStep): string | null {
  const s = step as LessonStep & {
    targetSentence?: string;
    targetPhrase?: string;
    acceptedAnswers?: string[];
    audioText?: string;
  };
  if (typeof s.targetSentence === "string") return s.targetSentence;
  if (typeof s.targetPhrase === "string") return s.targetPhrase;
  if (step.type === "particle_cloze" && typeof s.audioText === "string") return s.audioText;
  if (Array.isArray(s.acceptedAnswers) && typeof s.acceptedAnswers[0] === "string")
    return s.acceptedAnswers[0];
  return null;
}

function sweep(): {
  findings: Finding[];
  cued: number;
  indeterminate: Finding[];
  byType: Map<string, number>;
} {
  const findings: Finding[] = [];
  const indeterminate: Finding[] = [];
  const byType = new Map<string, number>();
  let cued = 0;
  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    for (const step of lesson.steps as LessonStep[]) {
      const cue = step.registerCue;
      if (!cue) continue;
      cued++;
      byType.set(step.type, (byType.get(step.type) ?? 0) + 1);
      const ja = producedJa(step);
      if (!ja) continue;
      const derived = derivePoliteness(ja);
      const row: Finding = {
        module: lesson.moduleId,
        lesson: lessonId,
        id: step.id,
        label: cue.label,
        claimed: cue.form,
        derived,
        ja,
      };
      if (derived === "indeterminate") indeterminate.push(row);
      else if (derived !== cue.form) findings.push(row);
    }
  }
  return { findings, cued, indeterminate, byType };
}

const { findings, cued, indeterminate, byType } = sweep();

describe("register cues agree with the register of the sentence they cue", () => {
  it("is not vacuous — the sweep actually sees the cued corpus", () => {
    // Green and vacuous look identical. If the compiler ever stops attaching
    // `registerCue`, or a glob change stops this walk from finding steps,
    // every assertion below would pass while checking nothing.
    expect(cued, "compiled JA steps carrying a structured register cue").toBeGreaterThan(800);
    expect(
      byType.get("build_sentence") ?? 0,
      "cued build_sentence steps",
    ).toBeGreaterThan(500);
  });

  it("no module exceeds its recorded disagreement budget", () => {
    const byModule = new Map<string, Finding[]>();
    for (const f of findings) {
      const list = byModule.get(f.module) ?? [];
      list.push(f);
      byModule.set(f.module, list);
    }
    const over: string[] = [];
    for (const [moduleId, list] of byModule) {
      const budget = DISAGREEMENT_BUDGET[moduleId] ?? 0;
      if (list.length > budget) {
        over.push(
          `${moduleId}: ${list.length} disagreements, budget ${budget}\n` +
            list
              .slice(0, 12)
              .map(
                (f) =>
                  `      ${f.id} cue "${f.label}" claims ${f.claimed}, ` +
                  `sentence reads ${f.derived}: ${f.ja}`,
              )
              .join("\n"),
        );
      }
    }
    expect(
      over,
      "modules over the register-agreement budget — a cue was authored over a " +
        "sentence in the other register. Fix the SENTENCE or the CUE; never the gate:\n  " +
        over.join("\n  "),
    ).toEqual([]);
  });

  it("the course-wide total never rises", () => {
    expect(
      findings.length,
      `course-wide cue/sentence disagreements (baseline ${DISAGREEMENT_TOTAL_BUDGET}, ` +
        "2026-09-15). This number only goes down.",
    ).toBeLessThanOrEqual(DISAGREEMENT_TOTAL_BUDGET);
  });

  it("the detector fires on a planted disagreement", () => {
    // Proof the gate can fail: a polite cue over a plain sentence.
    const { cue } = parseRegisterCue("Say politely: I eat at home");
    expect(cue?.form).toBe("polite");
    expect(derivePoliteness("いえで たべる。")).toBe("plain");
    expect(derivePoliteness("いえで たべる。")).not.toBe(cue?.form);
  });

  it("the indeterminate class never grows", () => {
    expect(
      indeterminate.map((f) => `${f.module} ${f.id} [${f.label}] ${f.ja}`),
      "cued steps whose produced Japanese has no derivable register — see " +
        "INDETERMINATE_BUDGET above. Either read the new one and record it, " +
        "or teach `derivePoliteness` the ending it is missing",
    ).toHaveLength(INDETERMINATE_BUDGET);
  });

  it("every cued step is a PRODUCTION step type", () => {
    // A cue only makes sense where the learner produces the sentence. If it
    // ever lands on a recognition step (an MCQ option, a match pair), the
    // compiler has attached it in the wrong place.
    expect(
      [...byType.keys()].sort(),
      "step types carrying a register cue",
    ).toEqual(["build_sentence", "listening_build", "particle_cloze", "translate"]);
  });
});

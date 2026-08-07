/**
 * ACCEPTANCE PROBE — a harness for auditing what the grader rejects.
 *
 * Not a test of the code; a way to ask the SHIPPED grader a question and get a
 * verified answer back, so an acceptance audit reports what actually fails
 * rather than what someone thinks might fail.
 *
 * Usage:
 *   PROBE=/abs/path/candidates.json npx vitest run src/features/languages/ja/dev/acceptanceProbe.test.ts
 *
 * candidates.json is either
 *   - `{"<stepId>": ["learner answer", ...], ...}` — graded against that
 *     step's REAL accepted answers and module index, or
 *   - `{"<authored sentence>": [...], "__module": 28}` for a sentence that
 *     isn't a step yet.
 *
 * Results land next to the input as `<PROBE>.results.txt`, one line per
 * candidate: PASS (already accepted) or FAIL (a rejection — if the answer is
 * correct Japanese, that is a finding).
 *
 * Skips silently with no PROBE set, so it costs a normal test run nothing.
 */
import { describe, expect, it } from "vitest";
import fs from "fs";
import { expandAcceptedAnswers } from "@/features/lesson/components/steps/translateVariants";
import { gradeTypedAnswer } from "@/shared/speech/loose-match";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";

type StepInfo = { answers: string[]; moduleIndex: number | null; prompt: string };

function indexTypedSteps(): Map<string, StepInfo> {
  const index = new Map<string, StepInfo>();
  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson) continue;
    const m = /ja-m(\d+)/.exec(lesson.id)?.[1];
    for (const step of lesson.steps) {
      if (step.type !== "translate" || !step.acceptedAnswers?.length) continue;
      index.set(step.id, {
        answers: step.acceptedAnswers,
        moduleIndex: m ? Number(m) : null,
        prompt: step.sourceText ?? "",
      });
    }
  }
  return index;
}

describe("acceptance probe", () => {
  const probePath = process.env.PROBE;

  it.skipIf(!probePath)("grades candidate answers against the real grader", () => {
    const spec = JSON.parse(fs.readFileSync(probePath as string, "utf8"));
    const fallbackModule =
      typeof spec.__module === "number" ? spec.__module : null;
    const steps = indexTypedSteps();
    const lines: string[] = [];
    let failures = 0;

    for (const [key, candidates] of Object.entries(spec)) {
      if (key === "__module") continue;
      const step = steps.get(key);
      const answers = step ? step.answers : [key, key.replace(/[。\s]/g, "")];
      const moduleIndex = step ? step.moduleIndex : fallbackModule;
      const accepted = expandAcceptedAnswers(answers, { moduleIndex });
      lines.push(
        `\n=== ${key}${step ? `  [m${step.moduleIndex}]` : ""}` +
          `${step?.prompt ? `\n    prompt : ${step.prompt}` : ""}` +
          `\n    target : ${answers[0]}` +
          `\n    accepts: ${accepted.length} variants`,
      );
      for (const candidate of candidates as string[]) {
        const ok = gradeTypedAnswer(accepted, candidate).correct;
        if (!ok) failures++;
        lines.push(`    ${ok ? "PASS" : "FAIL"}  ${candidate}`);
      }
    }

    lines.unshift(`rejected ${failures} of the candidates below`);
    fs.writeFileSync(`${probePath}.results.txt`, lines.join("\n"));
    expect(fs.existsSync(`${probePath}.results.txt`)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "./mockLessons";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";

/**
 * TYPED PRODUCTION IS FOR UTTERANCES. WORD-LEVEL RECALL IS MULTIPLE CHOICE.
 *
 * Spencer, 2026-07-28, from ja-m7-neo-2: the prompt was the two words "to
 * come" and the expected typed answer was くる. Nothing frames it, nothing to
 * place the word in — free-recall a spelling from a dictionary gloss.
 *
 * The principle was already the house style twice over and never written down
 * as a rule, so it never got enforced:
 *   - the ungraded word-typing "type-tease" card was cut on 2026-07-24
 *     ("word-level typed production correctly waits for FSRS graduation");
 *   - single-tile builds were banned for generators on 2026-07-17;
 *   - guide §4b bans word-level LISTENING from M5 on for the same reason.
 * Meanwhile `reviewFiller`'s fourth rotation slot kept emitting exactly this
 * shape — 57 steps across 16 modules. That slot is now a `translationMcq`:
 * same question, same word, tapped instead of typed.
 *
 * WHAT THIS ASSERTS. A `translate` prompt must be an English UTTERANCE, not a
 * vocabulary gloss. It is keyed on the prompt rather than on the answer's
 * length on purpose — 「いぬだ」 for "It's a dog." is one word long but the
 * retrieval is a predicate (which copula, which register), and 「ほん？」 for
 * "Is it a book?" is a question mark's worth of grammar. Those are honest
 * typed production. "to come" → くる is not, and the difference is visible in
 * the prompt and nowhere else.
 */

/** Every English gloss the course attaches to a single word. */
function atomGlosses(): Set<string> {
  const out = new Set<string>();
  for (const a of JA_COURSE_ATOMS as unknown as {
    meaningEn?: string;
    shortGloss?: string;
  }[]) {
    for (const g of [a.meaningEn, a.shortGloss]) if (g) out.add(g.trim().toLowerCase());
  }
  return out;
}

/** "Say politely: I go home" → "i go home". Frames are not the prompt. */
const unframe = (s: string) =>
  s
    .replace(/^[^:]{0,40}:\s*/, "")
    .replace(/[.?!]+$/, "")
    .trim()
    .toLowerCase();

describe("typed production is an utterance, not a word", () => {
  const glosses = atomGlosses();

  it("has glosses to compare against", () => {
    expect(glosses.size).toBeGreaterThan(500);
  });

  it("no translate step prompts with a bare vocabulary gloss", () => {
    const offenders: string[] = [];
    let scanned = 0;

    for (const mod of getMockCourse("ja").modules) {
      for (const entry of mod.lessons ?? []) {
        const lesson = getMockLessonContent(entry.id);
        if (!lesson) continue;
        for (const raw of lesson.steps) {
          const step = raw as unknown as {
            id: string;
            type: string;
            sourceText?: string;
            acceptedAnswers?: string[];
          };
          if (step.type !== "translate") continue;
          scanned++;
          const prompt = unframe(step.sourceText ?? "");
          if (glosses.has(prompt))
            offenders.push(
              `${step.id}: "${step.sourceText}" → ${(step.acceptedAnswers ?? [])[0]} — word-level recall must be an MCQ`,
            );
        }
      }
    }

    // Non-vacuity: a check that scans nothing looks exactly like one that
    // passes. There are ~330 translate steps in the shipped course.
    expect(scanned).toBeGreaterThan(250);
    // ...and the comparison itself must be live: the shape this guard exists
    // to catch has to be recognised when it is handed to it.
    expect(glosses.has(unframe("to come"))).toBe(true);

    expect(offenders).toEqual([]);
  });
});

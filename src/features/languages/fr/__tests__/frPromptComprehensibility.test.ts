/**
 * FR prompt-comprehensibility gate — the fr twin of
 * `es/__tests__/esPromptComprehensibility.test.ts`, with one structural
 * difference: the ratchet is **0** and STARTED at 0. ES measures down a
 * pre-gate backlog (467 as of 2026-08-18); French has no pre-gate content,
 * so a French-language MCQ prompt may use ONLY taught-by-then vocabulary,
 * function-word chrome, and cast names — from the first module onward
 * (pin F11).
 *
 * Instrument differences from ES, both deliberate:
 *   - «guillemet» spans are STRIPPED before classification and billing:
 *     the house convention quotes taught French surfaces inside English
 *     prompts («merci beaucoup»), and those quotes are the provenance
 *     gate's domain — billing the surrounding English words as "untaught
 *     French" would measure the instrument, not the content.
 *   - because of the strip, no ENGLISH_STOPWORDS list is needed yet: a
 *     prompt only classifies as French when its UNQUOTED prose is French.
 */
import { describe, expect, it } from "vitest";
import { FR_ALL_LESSONS } from "../curriculum";
import { getFrCourseAtoms } from "../courseAtoms";
import { frTokens, FR_FUNCTION_WORDS, FR_PROPER_NAMES } from "./moduleBarGuards";
import type { LessonStep } from "@/features/lesson/types";

const MAX_UNKNOWN_TOKEN_OCCURRENCES = 0;

const FRENCH_MARK = /[àâæçéèêëîïôœùûüÿ]/i;

/** Prompt prose with quoted-French spans removed. */
function unquoted(prompt: string): string {
  return prompt.replace(/«[^»]*»/g, " ");
}

function looksFrench(prose: string): boolean {
  if (FRENCH_MARK.test(prose)) return true;
  const fn = frTokens(prose).filter((t) => FR_FUNCTION_WORDS.has(t)).length;
  return fn >= 3;
}

// known surfaces per module, cumulative in pathway order (derived from the
// lesson list, which derives from the module glob).
function moduleOf(lessonId: string): string {
  return /^fr-(m\d+)-/.exec(lessonId)?.[1] ?? "";
}
const MODULE_ORDER = [...new Set(FR_ALL_LESSONS.map((l) => moduleOf(l.id)))];
const atomWordsByModule = new Map<string, Set<string>>();
{
  const cumulative = new Set<string>();
  const atoms = getFrCourseAtoms();
  for (const m of MODULE_ORDER) {
    for (const a of atoms) {
      if (a.fromModule !== m) continue;
      for (const w of frTokens(a.surface)) cumulative.add(w);
    }
    atomWordsByModule.set(m, new Set(cumulative));
  }
}

describe("fr prompt comprehensibility", () => {
  it(`unknown-word debt in French prompts stays ≤ ${MAX_UNKNOWN_TOKEN_OCCURRENCES}`, () => {
    const offenses: string[] = [];
    for (const lesson of FR_ALL_LESSONS) {
      const known = atomWordsByModule.get(moduleOf(lesson.id)) ?? new Set();
      for (const step of lesson.steps as LessonStep[]) {
        if (step.type !== "multiple_choice") continue;
        const prompt = (step as { prompt?: string }).prompt;
        if (!prompt) continue;
        const prose = unquoted(prompt);
        if (!looksFrench(prose)) continue;
        for (const t of frTokens(prose)) {
          if (FR_FUNCTION_WORDS.has(t) || FR_PROPER_NAMES.has(t) || known.has(t)) continue;
          offenses.push(`${lesson.id}/${step.id}: "${t}" (in "${prompt.slice(0, 60)}")`);
        }
      }
    }
    expect(
      offenses.length,
      `untaught-word occurrences in French-language prompts:\n  ${offenses.slice(0, 15).join("\n  ")}\n` +
        "Write prompts from taught vocabulary — this ratchet started at 0 and never rises.",
    ).toBeLessThanOrEqual(MAX_UNKNOWN_TOKEN_OCCURRENCES);
  });
});

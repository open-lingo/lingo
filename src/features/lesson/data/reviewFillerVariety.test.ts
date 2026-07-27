import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "./moduleCompiler";

/**
 * Review filler must not ask the same question twice in one lesson.
 *
 * The filler picks a sentence with `uniq[i % uniq.length]`, so once the slot
 * index wrapped past the number of available sentences it re-asked the first
 * one — same audio, same four options merely reordered (m11 review-1, slots 0
 * and 4) — while a sentence the lesson had actually authored never got a
 * comprehension check at all. Two slots, one question, and the coverage the
 * filler existed to provide silently lost.
 *
 * This is the same failure that produced "Pick the word for 'person'" five
 * times in m10, so the guard covers filler repetition generally, not just the
 * listening variant.
 */

const IR_DIR = join(__dirname, "..", "..", "languages", "ja", "curriculum", "ir");

type Probe = { type: string; audioKey?: string; prompt?: string; id: string };

function lessons() {
  return readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.json"))
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    .flatMap((f) => compileModule(require(join(IR_DIR, f))));
}

describe("review filler variety", () => {
  const all = lessons();

  it("compiles something to check", () => {
    expect(all.length).toBeGreaterThan(50);
  });

  it("never comprehension-checks the same audio twice in one lesson", () => {
    const dupes: string[] = [];
    for (const lesson of all) {
      const heard = new Map<string, number>();
      for (const step of lesson.steps as unknown as Probe[]) {
        if (step.type !== "listening_comprehension") continue;
        const key = step.audioKey ?? "";
        heard.set(key, (heard.get(key) ?? 0) + 1);
      }
      for (const [key, n] of heard) {
        if (n > 1) dupes.push(`${lesson.id}: ${key} ×${n}`);
      }
    }
    expect(dupes).toEqual([]);
  });

  it("rarely makes the correct answer the uniquely shortest option", () => {
    // Option length is a free cue: a 2-kana noun among three 6-kana conjugated
    // adjectives is answerable with no vocabulary at all. `translationMcq` now
    // prefers distractors within a mora of the target, which took this from
    // roughly half of m12's items to 5 course-wide — the residue is pools that
    // genuinely hold nothing of comparable length. Ratchet, not a floor.
    let total = 0;
    let guessable = 0;
    for (const lesson of all) {
      for (const step of lesson.steps as unknown as (Probe & {
        options?: { id: string; text: string }[];
      })[]) {
        if (step.type !== "multiple_choice") continue;
        if (!step.prompt?.startsWith("Pick the word")) continue;
        const options = step.options ?? [];
        const correct = options.find((o) => o.id === "correct");
        if (!correct) continue;
        total++;
        const size = (s: string) => [...s].length;
        if (
          options.every((o) => o.id === "correct" || size(o.text) > size(correct.text))
        ) {
          guessable++;
        }
      }
    }
    expect(total).toBeGreaterThan(100);
    expect(guessable / total).toBeLessThan(0.03);
  });

  it("never repeats a filler prompt within one lesson", () => {
    const dupes: string[] = [];
    for (const lesson of all) {
      const asked = new Map<string, number>();
      for (const step of lesson.steps as unknown as Probe[]) {
        if (!step.id.includes("-fill-") || !step.prompt) continue;
        asked.set(step.prompt, (asked.get(step.prompt) ?? 0) + 1);
      }
      for (const [prompt, n] of asked) {
        if (n > 1) dupes.push(`${lesson.id}: "${prompt}" ×${n}`);
      }
    }
    expect(dupes).toEqual([]);
  });
});

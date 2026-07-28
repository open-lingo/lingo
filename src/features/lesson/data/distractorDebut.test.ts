import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ModuleIR } from "./moduleCompiler";

/**
 * A WORD MAY NOT MEET THE LEARNER FIRST AS A WRONG ANSWER.
 *
 * Invariants 30/33/37 say a word's first appearance must be on an
 * intro-capable step. `moduleBarGuards` enforces that over the Japanese
 * SURFACES of a step — and a cloze's `options` are not a surface, so a form
 * could debut as a distractor and nothing looked.
 *
 * Found 2026-07-27 by m27's QA, which caught 「なんです」 offered as a wrong
 * answer in review-1 while んです/なんです do not debut until L5 — which the
 * course order delivers AFTER that review. Scanning every module for the same
 * shape then found a second instance in m27 itself (「なんだ」 in L1, introduced
 * in L2) that the review had missed, which is the argument for the scan over
 * the reading: two of the three hits below came from the machine.
 *
 * The pedagogy is the point. A distractor is the worst possible first
 * exposure: the learner meets the form while being told it is wrong, and the
 * explanation then has to talk about a word they have never been taught.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const IR_DIR = join(HERE, "../../languages/ja/curriculum/ir");

/**
 * Grandfathered, and it is worth saying why rather than hiding it: m6 offers
 * 「に」 as a cloze option in lesson 5 and formally introduces it in lesson 8.
 * に is a particle the learner has been reading in sentences since m4, so this
 * is a declaration-order quirk rather than a first exposure, and m6 is long
 * shipped. Any NEW entry here is a real defect — fix the content, not the list.
 */
const GRANDFATHERED = new Set(["m6 m6-neo-5 に"]);

type Beat = { kind?: string; options?: unknown[] };
type Lesson = { id?: string; introduces?: string[]; beats?: Beat[] };

describe("no word debuts as a distractor", () => {
  it("every cloze/MCQ option is already taught when it is offered", () => {
    const files = readdirSync(IR_DIR)
      .filter((f) => f.endsWith(".ir.json"))
      .sort((a, b) => (parseInt(a.slice(1)) || 0) - (parseInt(b.slice(1)) || 0));

    let scanned = 0;
    const offenders: string[] = [];

    for (const f of files) {
      const mod = f.replace(".ir.json", "");
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as ModuleIR;
      const lessons = ((ir as unknown as { lessons?: Lesson[] }).lessons ?? []);

      // The lesson array IS the course order — review-1 sits at index 3, so a
      // form introduced at index 4 is genuinely later than a review that
      // offers it, however early in the file it looks.
      const firstTaught = new Map<string, number>();
      lessons.forEach((l, i) => {
        for (const k of l.introduces ?? [])
          if (!firstTaught.has(k)) firstTaught.set(k, i);
      });

      lessons.forEach((l, i) => {
        for (const beat of l.beats ?? []) {
          if (beat.kind !== "particle-cloze" && beat.kind !== "mcq") continue;
          for (const opt of beat.options ?? []) {
            if (typeof opt !== "string") continue;
            scanned++;
            const taughtAt = firstTaught.get(opt);
            if (taughtAt === undefined || taughtAt <= i) continue;
            const key = `${mod} ${l.id} ${opt}`;
            if (GRANDFATHERED.has(key)) continue;
            offenders.push(
              `${key}: offered as a wrong answer at position ${i}, but 「${opt}」 ` +
                `does not debut until ${lessons[taughtAt].id} at position ${taughtAt}. ` +
                `Swap the distractor for something already taught.`,
            );
          }
        }
      });
    }

    // Non-vacuity: a scan that stops finding options looks exactly like a scan
    // that passes. If this fails, the IR beat shape moved, not the content.
    expect(scanned, "no cloze/MCQ options scanned — the IR beat shape moved")
      .toBeGreaterThan(500);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

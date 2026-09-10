import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "./moduleCompiler";

/**
 * Filler's noun/swap-slot pool must be MODULE-WIDE, not lesson-scoped.
 *
 * `docs/ja-n4-repetition-audit-2026-09-09.md` finding 2 / proposal 2: before
 * this fix, `reviewFiller`'s primary pool (`usable` inside the function) was
 * fed by `pool` in `compileModule` — THIS LESSON's own declared
 * `reviewPool` array, and nothing else. A word taught three lessons earlier
 * in the SAME MODULE could only reach an MCQ/speaking filler slot if that
 * lesson happened to re-list it in its own `reviewPool`; otherwise the
 * filler rotation just re-asked the same handful of words lesson after
 * lesson (m10-neo-1: "Pick the word for 'person'" five times in one
 * lesson — the defect `reviewFillerVariety.test.ts` "never repeats a filler
 * prompt" guards against *within* a lesson, but did nothing for the
 * across-lessons sameness the audit measured).
 *
 * This test proves the pool is module-wide: for each compiled lesson, at
 * least SOME filler steps must target a word that (a) is NOT in that
 * lesson's own declared `reviewPool`, and (b) WAS already taught earlier in
 * the same module (an earlier lesson's `introduces`, or an earlier lesson's
 * own `reviewPool`). Before the fix this count was 3 course-wide (an
 * incidental edge case in the underfiltered `fallback` argument, not the
 * intended mechanism) — after it, several hundred.
 *
 * Teaching order is NOT relaxed by this: a hit only counts a word already
 * introduced in a STRICTLY EARLIER lesson of the module, mirroring
 * `usableHere`'s own "teach-first" rule (inv 33) — this test would fail if
 * the fix ever let a filler reach for a not-yet-taught word, same as
 * `moduleCompiler.diagnostics.test.ts`'s buildability gate.
 */
const IR_DIR = join(__dirname, "..", "..", "languages", "ja", "curriculum", "ir");

type FillerProbe = {
  id: string;
  type: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  targetPhrase?: string;
};

interface IRLessonLite {
  id?: string;
  introduces?: string[];
  reviewPool?: string[];
}
interface IRLite {
  lessons: IRLessonLite[];
}

function fillerTarget(step: FillerProbe): string | null {
  if (step.type === "multiple_choice") {
    return step.options?.find((o) => o.id === step.correctOptionId)?.text ?? null;
  }
  if (step.type === "speaking") {
    return step.targetPhrase ?? null;
  }
  return null;
}

describe("filler pool is module-wide (rep-audit-2026-09-09 fix 2)", () => {
  const irFiles = readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"));

  it("finds IR modules to check", () => {
    expect(irFiles.length).toBeGreaterThan(20);
  });

  it("draws filler mcq/speaking targets from earlier lessons in the same module, not just the current lesson's own reviewPool", () => {
    let crossLessonHits = 0;
    const perModule = new Map<string, number>();
    for (const f of irFiles) {
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as IRLite;
      const compiled = compileModule(ir as never);
      // Module-new atoms, by the (strictly earlier) lesson index that
      // `introduces:` them — same "teach-first" notion `usableHere` enforces.
      const introLessonOf = new Map<string, number>();
      ir.lessons.forEach((l, li) => {
        for (const k of l.introduces ?? []) if (!introLessonOf.has(k)) introLessonOf.set(k, li);
      });
      ir.lessons.forEach((lesson, i) => {
        const ownPool = new Set(lesson.reviewPool ?? []);
        for (const step of compiled[i].steps as unknown as FillerProbe[]) {
          if (!step.id.includes("-fill-")) continue;
          const target = fillerTarget(step);
          if (!target || ownPool.has(target)) continue;
          const introLi = introLessonOf.get(target);
          const earlierOwnPoolHit = ir.lessons
            .slice(0, i)
            .some((l) => (l.reviewPool ?? []).includes(target));
          // Teaching-order guard: only count it if the word was genuinely
          // taught in a STRICTLY EARLIER lesson of this module (never the
          // current or a later one).
          if ((introLi !== undefined && introLi < i) || earlierOwnPoolHit) {
            crossLessonHits++;
            perModule.set(f, (perModule.get(f) ?? 0) + 1);
          }
          // Never taught later — teaching order must hold regardless.
          if (introLi !== undefined) expect(introLi).toBeLessThan(i);
        }
      });
    }
    // Baseline before the fix (2026-09-09): 3 course-wide, all one incidental
    // edge case. A real module-wide pool produces this in most modules that
    // have any filler at all — set well above the pre-fix noise floor.
    expect(crossLessonHits).toBeGreaterThan(50);
    // And it's not concentrated in one module — the mechanism is general.
    expect([...perModule.keys()].length).toBeGreaterThan(5);
  });
});

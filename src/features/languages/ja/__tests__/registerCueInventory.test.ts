/**
 * REGISTER-CUE INVENTORY GATE — no cue reaches a learner as prose.
 *
 * `parseRegisterCue` works off an ALLOWLIST (`data/registerCue.ts`), which is
 * the right trade for a rule that runs over 7,197 authored English fields —
 * m19's nineteen clock times ("The train comes at 8:10") are exactly what a
 * general "strip everything before the colon" rule would have ruined. The
 * cost of an allowlist is that a NEW authoring variant is silently not
 * badged: it stays in the prompt, reads correctly, and nobody notices that
 * the same string is now a directive on a flashcard.
 *
 * This gate is how it gets noticed. It walks every compiled JA step and
 * fails if any learner-facing English still opens with a cue-shaped prefix
 * the table does not know. Four lanes are authoring JA English right now, so
 * the first one to write "Say to your boss:" gets told here rather than on a
 * QA walk three weeks later.
 *
 * The `NOT_A_CUE` allowlist below is the other half, and every entry in it
 * was found by RUNNING this gate rather than guessed at: the course
 * legitimately writes "Build this sentence: …", "Translate: …" as task
 * framing, and m3 hand-authors two prompts that are entirely a scene. Neither
 * says anything about register.
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import { CUE_SHAPED, parseRegisterCue } from "@/features/lesson/data/registerCue";

/**
 * Leading `Word…:` framings that are NOT register cues. Lowercased; matched
 * exactly against the text before the colon.
 *
 * Two kinds, and both were found by running this gate rather than guessed at:
 *
 *  TASK framings — they name which exercise this is, not who you are talking
 *  to. From the m1-m5 hand-authored TS (measured 2026-09-15: 100 `Build this
 *  sentence:`, 33 `Translate:`, 4 `Build:`, 2 `Build the question:`, 1
 *  `Pick:`), plus the compiler's own un-cued build prefix and
 *  `buildSrsReviewLesson`'s generated review prompt.
 *
 *  SCENARIO framings — m3 hand-authors two one-off prompts whose ENTIRE text
 *  is a scene, with the colon introducing the scene's content rather than
 *  separating a directive from a gloss: `"Your friend asks: いぬ？ It IS a
 *  dog — pick the casual 'yeah, it's a dog.'"` and the match-pair label
 *  `"Reassuring: 'it's fine'"`. Those are not a cue over a sentence, so
 *  there is nothing to lift out; promoting them to badges would leave the
 *  prompts meaningless.
 */
const NOT_A_CUE: ReadonlySet<string> = new Set([
  // task framings
  "build",
  "build this sentence",
  "build the question",
  "build the sentence meaning",
  "translate",
  "pick",
  // m3 scenario framings
  "your friend asks",
  "reassuring",
]);

/** Every learner-facing English string a compiled step can carry. */
function englishFields(step: LessonStep): [string, string][] {
  const s = step as LessonStep & Record<string, unknown>;
  const out: [string, string][] = [];
  const take = (field: string) => {
    const v = s[field];
    if (typeof v === "string" && v) out.push([field, v]);
  };
  // The production prompt, under each step type's own name for it.
  take("prompt");
  take("sourceText");
  take("meaningEn");
  take("translation");
  take("hint");
  // Recognition surfaces: an MCQ's options are where a leaked cue is both
  // wrong and a giveaway (inv 8 — only the authored sentence carries one, so
  // the cued option stands out).
  if (Array.isArray(s.options)) {
    for (const o of s.options as unknown[]) {
      if (o && typeof o === "object" && typeof (o as { text?: unknown }).text === "string") {
        out.push(["options[].text", (o as { text: string }).text]);
      }
    }
  }
  if (Array.isArray(s.pairs)) {
    for (const p of s.pairs as unknown[]) {
      if (p && typeof p === "object" && typeof (p as { target?: unknown }).target === "string") {
        out.push(["pairs[].target", (p as { target: string }).target]);
      }
    }
  }
  return out;
}

type Leak = { module: string; id: string; field: string; prefix: string; text: string };

function sweep(): { leaks: Leak[]; scanned: number; withCue: number } {
  const leaks: Leak[] = [];
  let scanned = 0;
  let withCue = 0;
  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    for (const step of lesson.steps as LessonStep[]) {
      if (step.registerCue) withCue++;
      for (const [field, text] of englishFields(step)) {
        scanned++;
        const m = CUE_SHAPED.exec(text);
        if (!m) continue;
        const prefix = m[1].trim();
        if (NOT_A_CUE.has(prefix.toLowerCase())) continue;
        // A prefix the table DOES know must never survive to a compiled
        // step — if it does, a compile path was missed.
        leaks.push({ module: lesson.moduleId, id: step.id, field, prefix, text });
      }
    }
  }
  return { leaks, scanned, withCue };
}

const { leaks, scanned, withCue } = sweep();

describe("no register cue survives as prose in compiled JA content", () => {
  it("is not vacuous — the sweep sees the English corpus and the cue corpus", () => {
    expect(scanned, "learner-facing English fields scanned").toBeGreaterThan(5000);
    expect(withCue, "compiled steps carrying a structured cue").toBeGreaterThan(800);
  });

  it("finds no unrecognized cue-shaped prefix anywhere", () => {
    const byPrefix = new Map<string, Leak[]>();
    for (const l of leaks) {
      const list = byPrefix.get(l.prefix) ?? [];
      list.push(l);
      byPrefix.set(l.prefix, list);
    }
    const report = [...byPrefix.entries()].map(
      ([prefix, list]) =>
        `"${prefix}" ×${list.length} — e.g. ${list[0].module} ${list[0].id} ` +
        `(${list[0].field}): ${list[0].text}`,
    );
    expect(
      report,
      "cue-shaped prefixes still sitting inside learner-facing English. If this " +
        "is a NEW register cue, add it to CUE_TABLE in " +
        "src/features/lesson/data/registerCue.ts (form + audience + badge " +
        "label). If it is task or scenario framing, add it to NOT_A_CUE here, " +
        "with the reading. Do NOT edit the YAML to dodge the gate — one " +
        "authoring convention is the whole point:\n  " +
        report.join("\n  "),
    ).toEqual([]);
  });

  it("the detector fires on a planted unknown variant", () => {
    // Proof the gate can fail: a cue the table does not know stays in the
    // string (fail-closed), and CUE_SHAPED sees it.
    const planted = "Say to your boss: I'll be late";
    expect(parseRegisterCue(planted).cue).toBeUndefined();
    expect(parseRegisterCue(planted).text).toBe(planted);
    const m = CUE_SHAPED.exec(planted);
    expect(m?.[1]).toBe("Say to your boss");
    expect(NOT_A_CUE.has("say to your boss")).toBe(false);
  });

  it("does not mistake a clock time for a cue", () => {
    // m19 authors nineteen of these. `CUE_SHAPED` requires whitespace after
    // the colon, so 8:10 cannot match — which is why this gate can be strict.
    expect(CUE_SHAPED.test("The train comes at 8:10")).toBe(false);
    expect(CUE_SHAPED.test("It's 7:05 now")).toBe(false);
  });
});

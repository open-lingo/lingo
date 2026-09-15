/**
 * RULE 3 GATE, content half — the six-module review window
 * (TestFlight #91 #116 #128, Spencer 2026-09-15).
 *
 *   #91: "find something to replace this and similar 'low module short
 *         sentences' with, they don't belong in more advanced course work
 *         outside of review"
 *   #116: "いいえ has no business in advanced review"
 *   Topic 3: a six-module look-back for in-lesson review and filler pools —
 *         "yeah that should be perfect" — unless the word's FSRS card is due.
 *
 * The compiler has no learner state, so it enforces the CONTENT half only:
 * every filler and review-grid draw comes from what the last six modules
 * taught, plus this module's own vocabulary. The FSRS half ("half recent
 * things, half fsrs learnings") is `selectReviewHalves`, tested in
 * `features/lesson/data/reviewSplit.test.ts`.
 *
 * Also gated here: #128, "Tanaka fail" — a `match_pairs` grid whose card and
 * its own "translation" both read たなか, because `NAMES` course furniture has
 * no `courseAtoms` row and `resolve()` self-translated it. That one is a HARD
 * ZERO: a self-pair is unanswerable, not merely stale.
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";
import {
  RECENT_WINDOW_MODULES,
  RECENT_WINDOW_MAX_MODULES,
  chooseRecentWindow,
  getJaRecentKanaWindow,
} from "@/features/languages/ja/curriculum/recentVocabWindow";
import { moduleIndexOf } from "@/features/lesson/data/contentFloors";

/**
 * Out-of-window review/filler draws still admitted per module, 2026-09-15.
 *
 * This is a RATCHET, not a zero, and the measurements say why. Three
 * configurations, swept over the whole compiled JA course:
 *
 *   no window at all (the state before this lane)   2,821  (filler 1,322, grids 1,499)
 *   window on the filler pool only                  2,041  (filler   542, grids 1,499)
 *   window on the filler pool AND the review grid    1,679  (filler   542, grids 1,137)
 *
 * So the lane cuts stale draws by 40% overall and 59% on the filler, and the
 * residue has two named causes, neither of which more selection code can fix:
 *
 *  1. FILLER (542). Rule 3 is a RANK there, not a filter: hard-filtering cost
 *     13 lessons their 18-step density floor, and a short lesson is a worse
 *     defect than a slightly stale filler word. The fallback is reached only
 *     when every recent word is already used in that modality, so the count
 *     is a direct measure of how few recent words a module declares — m41–m46
 *     (76, 86, 83, 48, 43, 60) declare 17–25 new atoms against review pools
 *     that are mostly 10+ modules old.
 *  2. REVIEW GRIDS (1,137). A grid takes SIX tiles from a pool the author
 *     sizes at six to ten, so what it shows is the AUTHORED `reviewPool`,
 *     with the whole-registry emoji fallback behind it. Ranking the fallback
 *     recent-first cuts this ~20× and was reverted twice: it turns the
 *     m40–m45 provenance guards red on レストラン, an atom a reviewPool asserts
 *     is known while no lesson has ever introduced it (see the compiler's note
 *     at the fallback).
 *
 * Both residues are authoring work, enumerated in
 * `fb16-research/content-floors-violations.md`. Lower these numbers as those
 * lanes land; never raise one. A module not listed must be at zero.
 */
const OUT_OF_WINDOW_BUDGET: Readonly<Record<string, number>> = {
  m12: 2,
  m13: 37,
  m14: 9,
  m15: 34,
  m16: 15,
  m17: 13,
  m18: 67,
  m19: 20,
  m20: 29,
  m21: 19,
  m22: 4,
  m23: 5,
  m24: 22,
  m25: 3,
  m26: 38,
  m27: 13,
  m28: 9,
  m29: 47,
  m30: 42,
  m31: 32,
  m32: 33,
  m33: 36,
  m34: 32,
  m35: 69,
  m36: 54,
  m37: 96,
  m38: 84,
  m39: 94,
  m40: 72,
  m41: 120,
  m42: 98,
  m43: 119,
  m44: 93,
  m45: 87,
  m46: 132,
};

/** The one number to watch fall. 2,821 before the lane. */
const OUT_OF_WINDOW_TOTAL_BUDGET = 1679;

type Draw = { module: string; kind: string; step: string; kana: string };

describe("RULE 3 (content half) — review/filler pools are inside the window", () => {
  const atomKana = new Set(JA_COURSE_ATOMS.map((a) => a.kana));
  const draws: Draw[] = [];
  const selfPairs: string[] = [];
  let gridsSeen = 0;
  let fillsSeen = 0;

  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    for (const step of lesson.steps as LessonStep[]) {
      const r = step as unknown as Record<string, unknown>;
      if (step.type === "match_pairs") {
        gridsSeen++;
        for (const p of (r.pairs as Array<{ source: string; target: string }>) ?? []) {
          if (p.source === p.target) {
            selfPairs.push(`${lesson.moduleId} ${step.id} :: ${p.source}`);
          }
        }
      }
      if (step.id.includes("-fill-")) fillsSeen++;
    }
    if (moduleIndexOf(lesson.moduleId) < 12) continue;
    const window = getJaRecentKanaWindow(lesson.moduleId);
    if (!window) continue;
    const stale = (kana: string) => atomKana.has(kana) && !window.has(kana);
    for (const step of lesson.steps as LessonStep[]) {
      const r = step as unknown as Record<string, unknown>;
      if (step.id.includes("-fill-")) {
        // The filler's TARGET, not its distractors: the target is the draw
        // (`pickAtom`), the distractors come from the same pool by definition.
        if (step.type === "speaking") {
          const kana = String(r.targetPhrase ?? "");
          if (stale(kana)) {
            draws.push({ module: lesson.moduleId, kind: "fill", step: step.id, kana });
          }
        }
        if (step.type === "multiple_choice") {
          const opts = (r.options as Array<{ id: string; text: string }>) ?? [];
          const correct = opts.find((o) => o.id === r.correctOptionId);
          if (correct && stale(correct.text)) {
            draws.push({
              module: lesson.moduleId,
              kind: "fill",
              step: step.id,
              kana: correct.text,
            });
          }
        }
      }
      if (step.type === "match_pairs") {
        for (const p of (r.pairs as Array<{ source: string }>) ?? []) {
          if (stale(p.source)) {
            draws.push({
              module: lesson.moduleId,
              kind: "match",
              step: step.id,
              kana: p.source,
            });
          }
        }
      }
    }
  }

  it("is not vacuous — the sweep sees filler steps and match grids", () => {
    expect(fillsSeen, "compiled filler steps walked").toBeGreaterThan(500);
    expect(gridsSeen, "match_pairs grids walked").toBeGreaterThan(400);
  });

  it("#128 — no match grid pairs a card with itself (Tanaka fail)", () => {
    expect(
      selfPairs,
      "match_pairs whose source and target are the same string — course " +
        "furniture (NAMES) has no courseAtoms row, so resolve() self-translates " +
        "it and the grid becomes unanswerable:\n  " + selfPairs.join("\n  "),
    ).toEqual([]);
  });

  it("no module exceeds its out-of-window budget", () => {
    const byModule = new Map<string, Draw[]>();
    for (const d of draws) {
      const list = byModule.get(d.module) ?? [];
      list.push(d);
      byModule.set(d.module, list);
    }
    const over: string[] = [];
    for (const [moduleId, list] of byModule) {
      const budget = OUT_OF_WINDOW_BUDGET[moduleId] ?? 0;
      if (list.length > budget) {
        over.push(
          `${moduleId}: ${list.length} out-of-window draws, budget ${budget}\n` +
            list
              .slice(0, 10)
              .map((d) => `      ${d.kind} ${d.step} :: ${d.kana}`)
              .join("\n"),
        );
      }
    }
    expect(
      over,
      "modules drawing review/filler material from outside the six-module " +
        "window (#91 #116):\n  " + over.join("\n  "),
    ).toEqual([]);
  });

  it("the course-wide out-of-window total never rises", () => {
    expect(
      draws.length,
      `out-of-window review/filler draws (baseline ${OUT_OF_WINDOW_TOTAL_BUDGET}, ` +
        "2026-09-15; 2821 before the six-module window landed). Only goes down.",
    ).toBeLessThanOrEqual(OUT_OF_WINDOW_TOTAL_BUDGET);
  });

  it("the window itself is truthful and narrow", () => {
    const m33 = getJaRecentKanaWindow("m33");
    expect(m33, "m33 has a computable window").not.toBeNull();
    // Non-vacuity in both directions: it must EXCLUDE the #116 word and
    // INCLUDE the module's own vocabulary.
    expect(m33!.has("いいえ"), "いいえ (m1 interjection) is not recent at m33").toBe(false);
    // m33's own 自動詞/他動詞 pair — declared in its `newAtoms`, so recent by
    // definition. (あける would NOT qualify: m33 lists it in a reviewPool but
    // m14 taught it, which is exactly the distinction the window draws.)
    expect(m33!.has("おちる"), "m33's own 自動詞 おちる is recent at m33").toBe(true);
    expect(m33!.has("おとす"), "m33's own 他動詞 おとす is recent at m33").toBe(true);
    expect(m33!.size).toBeGreaterThan(50);
    // …and it must be a small fraction of everything taught by then.
    expect(m33!.size).toBeLessThan(400);
  });

  it("there is no window below the IR era (callers must not filter)", () => {
    // `null` is the honest answer, not an empty set: an empty set would filter
    // every pool to nothing. m11's window start (m5) has no IR projection.
    expect(getJaRecentKanaWindow("m11")).toBeNull();
    expect(getJaRecentKanaWindow("m3")).toBeNull();
    expect(getJaRecentKanaWindow("m1kata")).toBeNull();
  });

  it("the floor widens the window, and never past the ceiling", () => {
    // Proof the widening can fire and that it is bounded — the bug this
    // replaced widened m46 to FORTY modules because it was sized on a single
    // lesson's slice instead of the module's declared pool.
    const narrow = chooseRecentWindow("m46", [], (c: never) => c, 1000);
    expect(narrow).not.toBeNull();
    expect(narrow!.modules).toBe(RECENT_WINDOW_MAX_MODULES);
    // A satisfied floor keeps Spencer's number.
    const kept = [...getJaRecentKanaWindow("m46")!].map((k) => ({ kana: k }));
    const exact = chooseRecentWindow("m46", kept, (c) => c.kana, 1);
    expect(exact!.modules).toBe(RECENT_WINDOW_MODULES);
  });
});

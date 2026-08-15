import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getJaTaughtKanaBeforeModule } from "@/features/languages/ja/curriculum/taughtVocab";
import { siblingsOf } from "@/features/languages/ja/jaSiblingSets";
import type { BuildSentenceStep, LessonContent } from "../types";
import { getMockLessonContent } from "./mockLessons";
import { minDistractorsFor, padBuildTileFloor } from "./buildTileFloor";

/**
 * build_sentence / listening_build distractor floor (Spencer QA
 * 2026-07-16: "we give them the answer a little too easy... can we add
 * more [distractors]"). Backfill is a central pass in getMockLessonContent
 * — see buildTileFloor.ts header for the full design note. This file
 * mirrors matchPairsPairCount.test.ts / matchPairsFloorDispatch.test.ts's
 * split: whole-course sweep (the regression gate) + synthetic-lesson unit
 * tests (the contract, independent of live content drifting).
 */

function languageLessonIds(languageId: string): string[] {
  const course = getMockCourse(languageId);
  const ids: string[] = [];
  type LessonRef = { id: string };
  type ModuleShape = {
    lessons?: LessonRef[];
    lessonGroups?: { lessons?: LessonRef[] }[];
  };
  for (const mod of course.modules as unknown as ModuleShape[]) {
    for (const l of mod.lessons ?? []) ids.push(l.id);
    for (const g of mod.lessonGroups ?? []) {
      for (const l of g.lessons ?? []) ids.push(l.id);
    }
  }
  return ids;
}

describe("minDistractorsFor", () => {
  it("scales down for 2-tile answers, fills the picker grid at 1, caps at 3", () => {
    expect(minDistractorsFor(0)).toBe(0);
    // 1-tile answers render as the MCQ-shaped picker, which needs 4 options
    // to paint a 2x2 grid instead of giant stretched rows (2026-07-24).
    expect(minDistractorsFor(1)).toBe(3);
    expect(minDistractorsFor(2)).toBe(2);
    expect(minDistractorsFor(3)).toBe(3);
    expect(minDistractorsFor(4)).toBe(3);
    expect(minDistractorsFor(9)).toBe(3);
  });
});

describe("word-granularity build tile floor — whole-course sweep", () => {
  it.each(["ja", "es", "ko"])(
    "every word-granularity build_sentence/listening_build step in %s meets its floor",
    (languageId) => {
      const violations: string[] = [];
      for (const id of languageLessonIds(languageId)) {
        const lesson = getMockLessonContent(id);
        if (!lesson) continue;
        for (const s of lesson.steps as unknown as Array<Record<string, unknown>>) {
          if (s.type !== "build_sentence" && s.type !== "listening_build") continue;
          if (s.granularity !== "word") continue;
          const tiles = s.tiles as string[];
          const correctOrder = s.correctOrder as string[];
          const distractors = tiles.length - correctOrder.length;
          const floor = minDistractorsFor(correctOrder.length);
          if (distractors < floor) {
            violations.push(
              `${id}/${s.id as string}: answer=${correctOrder.length} distractors=${distractors} floor=${floor}`,
            );
          }
        }
      }
      expect(violations, violations.join("\n")).toEqual([]);
    },
  );

  // A tile bank may legitimately repeat a token the SAME number of times
  // correctOrder needs it (いいえ needs two い tiles; a たり…たりする build
  // needs two たり tiles) — that's not a duplicate-distractor bug. The real
  // bug (task invariant: "distractors must never duplicate an answer
  // tile") is a tile appearing MORE times than correctOrder needs — a
  // "distractor" that's actually just a free extra correct tile, since
  // grading compares placed TEXT, not tile identity.
  //
  // No exemptions: the ja-m23 double-が authoring bugs flagged when this
  // gate landed (2026-07-16) were fixed the same day (duplicate が →
  // を distractor), so every step must now pass clean.
  const PRE_EXISTING_OVERSUPPLY_EXEMPTIONS = new Set<string>([]);

  it("no word-granularity build tile is oversupplied beyond what correctOrder needs", () => {
    const violations: string[] = [];
    for (const languageId of ["ja", "es", "ko"]) {
      for (const id of languageLessonIds(languageId)) {
        const lesson = getMockLessonContent(id);
        if (!lesson) continue;
        for (const s of lesson.steps as unknown as Array<Record<string, unknown>>) {
          if (s.type !== "build_sentence" && s.type !== "listening_build") continue;
          if (s.granularity !== "word") continue;
          const key = `${id}/${s.id as string}`;
          if (PRE_EXISTING_OVERSUPPLY_EXEMPTIONS.has(key)) continue;
          const tiles = s.tiles as string[];
          const correctOrder = s.correctOrder as string[];
          const needed = new Map<string, number>();
          for (const t of correctOrder) {
            const k = t.toLowerCase();
            needed.set(k, (needed.get(k) ?? 0) + 1);
          }
          const have = new Map<string, number>();
          for (const t of tiles) {
            const k = t.toLowerCase();
            have.set(k, (have.get(k) ?? 0) + 1);
          }
          // A pure distractor (needed = 0) must appear at most once; an
          // answer token must never exceed the count correctOrder needs.
          for (const [tile, count] of have) {
            const need = needed.get(tile) ?? 0;
            if (need === 0 && count > 1) {
              violations.push(`${key}: distractor "${tile}" x${count}`);
            } else if (need > 0 && count > need) {
              violations.push(`${key}: answer-token "${tile}" needed=${need} have=${count}`);
            }
          }
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

/**
 * B088 regression — the pad's fill pool used to trust registry `fromModule`
 * (stale old-course provenance), injecting words the live course never
 * taught into banks as reject-only tiles. The 2026-08-09 learner-sim walks
 * (docs/learner-sim/m16-packs-2026-08-09.md finding 1,
 * docs/learner-sim/m8-rebuild-walk-2026-08-09.md finding 4) proved the
 * compiled banks clean and every untaught distractor a pad pick. The pool is
 * now intersected with `getJaTaughtKanaBeforeModule` (IR priorVocab — the
 * compiler's truthful set).
 */
describe("build tile pad never injects untaught words (B088)", () => {
  // The exact pad picks the walks caught, per lesson. Words, not step ids:
  // pad fill is seeded on step id, so a content edit could move a pick to a
  // sibling step while remaining just as wrong.
  const WALK_LEAKS: Record<string, string[]> = {
    "ja-m8-neo-1": ["ぷりん"],
    "ja-m16-neo-10": ["コンビニ", "がっこう", "こうえん", "へや", "まいにち", "ひるごはん"],
    "ja-m16-neo-11": ["コンビニ", "がっこう", "こうえん", "へや", "まいにち", "ひるごはん"],
    "ja-m16-neo-review-3": ["コンビニ", "がっこう", "こうえん", "へや", "まいにち", "ひるごはん"],
  };

  it("the walks' specific untaught pad picks can no longer appear", () => {
    let scanned = 0;
    const violations: string[] = [];
    for (const [lessonId, leaks] of Object.entries(WALK_LEAKS)) {
      const lesson = getMockLessonContent(lessonId);
      expect(lesson, `${lessonId} must exist — a missing lesson would make this check vacuous`).not.toBeNull();
      for (const s of lesson!.steps as unknown as Array<Record<string, unknown>>) {
        if (s.type !== "build_sentence" && s.type !== "listening_build") continue;
        if (s.granularity !== "word") continue;
        scanned++;
        const tiles = s.tiles as string[];
        for (const leak of leaks) {
          if (tiles.includes(leak)) {
            violations.push(`${lessonId}/${s.id as string}: untaught "${leak}" in bank`);
          }
        }
      }
    }
    // Repo standing hazard: a check that matches nothing looks exactly like
    // a check that passes. The walked lessons carry dozens of word builds.
    expect(scanned).toBeGreaterThan(20);
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("every JA pad-appended tile is drawn from the truthful taught set", () => {
    // Synthetic m16 lesson at neo index 1: nothing of m16's own vocabulary is
    // live-attributed at-or-before neo-1, so every appended tile must come
    // from what earlier modules actually taught (IR priorVocab + furniture).
    const step: BuildSentenceStep = {
      id: "ja-b088-contract-build",
      type: "build_sentence",
      prompt: "Build: I eat rice.",
      targetSentence: "ごはん を たべる",
      tiles: ["ごはん", "を", "たべる"],
      correctOrder: ["ごはん", "を", "たべる"],
      granularity: "word",
    };
    const lesson = buildLesson("ja", "m16", step);
    lesson.id = "ja-m16-neo-1"; // neo-shaped id — engages the same-module gate
    const padded = padBuildTileFloor(lesson);
    const result = padded.steps[0] as BuildSentenceStep;
    const appended = result.tiles.slice(step.tiles.length);
    expect(appended.length).toBeGreaterThan(0); // pad must actually fire
    const taught = getJaTaughtKanaBeforeModule("m16");
    for (const tile of appended) {
      expect(taught.has(tile), `pad appended "${tile}", which m1–m15 never taught`).toBe(true);
    }
  });

  it("taught same-category siblings still pad in (Spencer 2026-07-24 mechanism intact)", () => {
    // ごはん's food siblings that the course HAS taught by m16 — the fix must
    // narrow the pool to taught words, not disable sibling-first fill.
    const taught = getJaTaughtKanaBeforeModule("m16");
    const taughtFoodSiblings = siblingsOf("ごはん").filter((k) => taught.has(k));
    expect(taughtFoodSiblings.length).toBeGreaterThan(0); // control of the control
    // Single-tile ごはん pick: food is the only sibling category in play, so
    // sibling-first ranking must surface a taught food word among the fill.
    const step: BuildSentenceStep = {
      id: "ja-b088-sibling-build",
      type: "build_sentence",
      prompt: "Build: rice.",
      targetSentence: "ごはん",
      tiles: ["ごはん"],
      correctOrder: ["ごはん"],
      granularity: "word",
    };
    const lesson = buildLesson("ja", "m16", step);
    lesson.id = "ja-m16-neo-1";
    const padded = padBuildTileFloor(lesson);
    const result = padded.steps[0] as BuildSentenceStep;
    const appended = result.tiles.slice(step.tiles.length);
    expect(
      appended.some((t) => taughtFoodSiblings.includes(t)),
      `expected a taught food sibling (${taughtFoodSiblings.join("/")}) among pad fill [${appended.join(" ")}]`,
    ).toBe(true);
  });

  it("accessor: the truthful set rejects the walk leaks and keeps taught words", () => {
    const m16 = getJaTaughtKanaBeforeModule("m16");
    for (const w of ["コンビニ", "がっこう", "こうえん", "へや", "まいにち", "ひるごはん"]) {
      expect(m16.has(w), `${w} is not taught by m1–m15 and must not be in the m16 set`).toBe(false);
    }
    for (const w of ["ごはん", "みず", "りょうり", "ねこ"]) {
      expect(m16.has(w), `${w} IS taught before m16 and must stay available`).toBe(true);
    }
    const m8 = getJaTaughtKanaBeforeModule("m8");
    expect(m8.has("ぷりん"), "ぷりん (kana-drill attribution only) must not count as taught").toBe(false);
    // Fallback path (no IR): m3 draws on real attribution from m1–m2 kana-row
    // vocab, and must never see later-module vocabulary.
    const m3 = getJaTaughtKanaBeforeModule("m3");
    expect(m3.size).toBeGreaterThan(0);
    expect(m3.has("きょうしつ")).toBe(false);
  });
});

function buildLesson(
  languageId: string,
  moduleId: string,
  step: BuildSentenceStep,
): LessonContent {
  return {
    id: `${languageId}-${moduleId}-pad-test`,
    moduleId,
    courseId: "mock-1",
    languageId,
    title: "pad test",
    steps: [step],
  };
}

describe("padBuildTileFloor — synthetic-lesson contract", () => {
  it("tops up a ja 3-tile-answer step with only 1 distractor to the 3-distractor floor", () => {
    const step: BuildSentenceStep = {
      id: "ja-pad-test-build",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "いち に さん",
      tiles: ["いち", "に", "さん", "ねこ"],
      correctOrder: ["いち", "に", "さん"],
      granularity: "word",
    };
    const lesson = buildLesson("ja", "m5", step);
    const padded = padBuildTileFloor(lesson);
    const result = padded.steps[0] as BuildSentenceStep;
    expect(result.correctOrder).toEqual(step.correctOrder); // answer untouched
    expect(result.tiles.length - result.correctOrder.length).toBe(3);
    // Original tiles preserved verbatim (padding only appends).
    expect(result.tiles.slice(0, 4)).toEqual(step.tiles);
    // No fill duplicates an existing tile.
    const lower = result.tiles.map((t) => t.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("does not touch a step already at/above its floor", () => {
    const step: BuildSentenceStep = {
      id: "ja-pad-test-build-2",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "いち",
      tiles: ["に", "いち", "さん", "よん"],
      correctOrder: ["いち"],
      granularity: "word",
    };
    const lesson = buildLesson("ja", "m5", step);
    const padded = padBuildTileFloor(lesson);
    expect(padded).toBe(lesson); // identity — no change
  });

  it("leaves character-granularity steps untouched (alphabet acquisition is out of scope)", () => {
    const step: BuildSentenceStep = {
      id: "ja-pad-test-char",
      type: "build_sentence",
      prompt: "Spell it",
      targetSentence: "いち",
      tiles: ["い", "ち"],
      correctOrder: ["い", "ち"],
      granularity: "character",
    };
    const lesson = buildLesson("ja", "m1", step);
    const padded = padBuildTileFloor(lesson);
    expect(padded).toBe(lesson); // identity — no change
  });

  it("leaves a language with no wired atom pool untouched", () => {
    const step: BuildSentenceStep = {
      id: "fr-pad-test-build",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "un deux trois",
      tiles: ["un", "deux", "trois"],
      correctOrder: ["un", "deux", "trois"],
      granularity: "word",
    };
    const lesson = buildLesson("fr", "m1", step);
    const padded = padBuildTileFloor(lesson);
    expect(padded).toBe(lesson); // identity — not a pooled language
  });
});

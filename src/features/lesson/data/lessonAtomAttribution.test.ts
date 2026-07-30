import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
// Importing mockLessons registers the `__lingo_get_lesson_content__` global
// the index uses to resolve lesson content (cycle-avoidance pattern).
import { getMockLessonContent, getAvailableMockLessonIds } from "./mockLessons";
import { getAtomsForLesson } from "./lessonAtomIndex";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  JA_COURSE_ATOMS,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";
import { ROW_SUB_LESSON_IDS } from "./generatedHiraganaLessons";
import { isGradedStep } from "./_stepPredicates";

/**
 * A lesson introduces the atoms it actually USES — not the ones whose kana
 * happen to occur inside some other word.
 *
 * `fallbackAtomsForLesson` used to attribute atoms with
 * `JSON.stringify(lesson.steps).includes(surface)`. Japanese has no spaces, so
 * that matched a surface anywhere at all: inside a longer word, inside the
 * English gloss, inside a step id. Across m8+ it attributed 184 atoms where
 * exact matching attributes 80, and every one of the 104 differences was an
 * artefact of the kind named below.
 *
 * The failure is silent and it reaches the learner: the lesson renders
 * perfectly, and the learner simply begins getting SRS reviews for a word no
 * lesson ever taught them. Nothing looks broken.
 *
 * The index now asks the compiler — `exercisedAtoms` and the tokenizer's own
 * tiles — and only falls back to substring matching for the handful of lessons
 * that carry neither.
 */

/** Real false positives the substring fallback produced. */
const NEVER_ATTRIBUTED: { lesson: string; kana: string; because: string }[] = [
  { lesson: "ja-m11-neo-1", kana: "くる", because: "くるま (car) contains it" },
  { lesson: "ja-m11-neo-3", kana: "とし", because: "としょかん (library) contains it" },
  { lesson: "ja-m12-neo-2", kana: "はん", because: "ごはん (meal) contains it" },
  { lesson: "ja-m12-neo-5", kana: "いま", because: "います (exists) contains it" },
  { lesson: "ja-m8-neo-1", kana: "いい", because: "いいえ (no) contains it" },
];

describe("lesson→atom attribution is exact, not substring", () => {
  it("has the fixtures it names", () => {
    for (const { lesson } of NEVER_ATTRIBUTED) {
      expect(getMockLessonContent(lesson), lesson).toBeTruthy();
    }
  });

  it("never attributes an atom the lesson only contains as a substring", () => {
    const offenders: string[] = [];
    for (const { lesson, kana, because } of NEVER_ATTRIBUTED) {
      const atoms = getAtomsForLesson(lesson, "ja");
      if (atoms.some((a) => a.kana === kana)) {
        offenders.push(`${lesson} was credited ${kana} — ${because}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("only attributes atoms the lesson tiles or exercises", () => {
    // The general property, so a future refactor cannot reintroduce the bug
    // through a path the fixtures above happen to miss.
    const offenders: string[] = [];
    for (const id of getAvailableMockLessonIds()) {
      if (!/^ja-m\d+-/.test(id)) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;

      const exercised = new Set<string>();
      const tiled = new Set<string>();
      for (const step of lesson.steps) {
        const s = step as unknown as { exercisedAtoms?: string[]; tiles?: string[] };
        for (const a of s.exercisedAtoms ?? []) exercised.add(a);
        for (const t of s.tiles ?? []) tiled.add(t);
      }
      // Lessons with no atom evidence at all still use the old fallback by
      // design — there is nothing better to ask.
      if (!exercised.size && !tiled.size) continue;

      for (const atom of getAtomsForLesson(id, "ja")) {
        // The static `introducedByLessonId` index is authoritative where it
        // exists AND resolves; this check is about the DERIVED attributions —
        // which since B068 include atoms whose static attribution is dead
        // (points at a deleted lesson), so those must pass the evidence check
        // like any other fallback atom.
        if (
          atom.introducedByLessonId &&
          getMockLessonContent(atom.introducedByLessonId)
        )
          continue;
        const surfaces = [
          ...atom.kana.split("/").map((s) => s.trim()),
          ...(atom.kanji?.split("/").map((s) => s.trim()) ?? []),
        ].filter(Boolean);
        if (exercised.has(atom.id)) continue;
        if (surfaces.some((s) => tiled.has(s))) continue;
        offenders.push(`${id}: ${atom.kana} (${atom.id}) is neither tiled nor exercised`);
      }
    }
    expect(offenders.slice(0, 15)).toEqual([]);
  });
});

/**
 * B068 conformance (2026-07-29). Two ratchets, both may only go DOWN:
 *
 * 1. DANGLING ATTRIBUTIONS — `introducedByLessonId` values that name a lesson
 *    the registry cannot resolve. The rewrite renumbered modules and deleted
 *    lessons; 234 atoms were left pointing at ja-m1-l1 / ja-m4-1-1 / …, and
 *    each dangling pointer suppressed the module-fallback unlock path forever.
 *    The runtime now treats a dangling attribution as unset (lessonAtomIndex
 *    `isDeadAttribution`), so the damage is contained — but NEW dangling
 *    attributions are still authoring bugs. Never point an atom at a lesson id
 *    without checking it resolves; when repointing/deleting stale rows, lower
 *    the pin in the same commit.
 *
 * 2. GRADED-BUT-NEVER-UNLOCKABLE — the learner-visible symptom: atoms a live
 *    lesson grades (creating their FSRS card) that NO live lesson completion
 *    can ever unlock, so the flashcard course deck and every unlocked-gated
 *    review pool can never select them again. Silent retention loss. Was 287
 *    before the isDeadAttribution fix. Vocab-pack authoring (B065 wave) and
 *    attribution re-homing are the only ways this moves.
 */
describe("attribution integrity (B068)", () => {
  const eligible = JA_COURSE_ATOMS.filter(isSrsEligibleAtom);

  /** Every lesson id a course-walking learner can complete. */
  function liveLessonIds(): string[] {
    const ids: string[] = [];
    for (const mod of getMockCourse("ja").modules) {
      for (const l of mod.lessons) {
        ids.push(l.id);
        // Kana rows complete per sub-lesson; credit their unlocks too.
        const rowId = /^ja-m1-(.+)$/.exec(l.id)?.[1];
        if (rowId && ROW_SUB_LESSON_IDS[rowId]) {
          ids.push(...ROW_SUB_LESSON_IDS[rowId]);
        }
      }
    }
    return ids;
  }

  // 234 → 232 on 2026-07-29: the m11 vocab packs (B067) deleted the dead
  // ja-m25-4-2 / ja-m29-2-1 attributions on はじめて / おぼえる when re-homing
  // them to m11 (fallback attribution now derives from the pack lessons).
  const MAX_DANGLING_ATTRIBUTIONS = 232;

  it("dangling introducedByLessonId count only goes DOWN", () => {
    const dangling = eligible.filter(
      (a) => a.introducedByLessonId && !getMockLessonContent(a.introducedByLessonId),
    );
    if (process.env.EXPOSURE_REPORT) {
      writeFileSync(
        "/tmp/ja-dangling-attributions.txt",
        [
          `dangling introducedByLessonId: ${dangling.length} / ${eligible.length}`,
          ...dangling.map((a) => `${a.kana}\t${a.id}\t→ ${a.introducedByLessonId}`),
        ].join("\n"),
      );
    }
    expect(dangling.length).toBeLessThanOrEqual(MAX_DANGLING_ATTRIBUTIONS);
  });

  /**
   * 287 before the isDeadAttribution fix (matches the 2026-07-29 audit probe
   * exactly — positive-controlled by neutering the fix); 226 after it. The
   * residual is cause (B) in both flavours (measured 2026-07-29): 131 carry no
   * attribution and 95 carry a dead one, and in each case the atom's legacy
   * `fromModule` names a module whose live lessons never tile/exercise the
   * word (ちち with fromModule:"m8" taught by ja-m17-neo-1), which the
   * fallback's module-equality filter cannot bridge. Fixed by re-homing
   * `fromModule` to the live teaching module — the vocab-pack wave does this
   * per pack. `EXPOSURE_REPORT=1` dumps /tmp/ja-graded-never-unlockable.txt.
   */
  // 226 → 224 on 2026-07-29: m13 vocab pack 3 (B067) — fromModule re-homes
  // made two of the legacy-fromModule residual unlockable via the pack lesson.
  // 224 → 223 on 2026-07-29: m14 vocab pack 4 (B067) + the すき/きらい/ほしい
  // re-homes to m13 (their live teaching module — ja-m13-neo-6/-7).
  const MAX_GRADED_NEVER_UNLOCKABLE = 223;

  it("graded-but-never-unlockable count only goes DOWN", () => {
    const unlockable = new Set<string>();
    const graded = new Set<string>();
    const seen = new Set<string>();
    for (const id of liveLessonIds()) {
      if (seen.has(id)) continue;
      seen.add(id);
      for (const atom of getAtomsForLesson(id, "ja")) {
        unlockable.add(atom.id.replace(/^ja:/, ""));
      }
      const content = getMockLessonContent(id);
      if (!content) continue;
      for (const step of content.steps) {
        if (!isGradedStep(step)) continue;
        const ex = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        for (const raw of ex) graded.add(raw.replace(/^ja:/, ""));
      }
    }
    // Instrument guard: an empty walk would pass everything vacuously.
    expect(unlockable.size).toBeGreaterThan(150);
    expect(graded.size).toBeGreaterThan(400);

    const stuck = eligible.filter(
      (a) => graded.has(a.id) && !unlockable.has(a.id),
    );
    if (process.env.EXPOSURE_REPORT) {
      writeFileSync(
        "/tmp/ja-graded-never-unlockable.txt",
        [
          `graded but never unlockable: ${stuck.length} / ${eligible.length}`,
          ...stuck.map(
            (a) =>
              `${a.kana}${a.kanji ? `(${a.kanji})` : ""}\t${a.id}\t(from ${a.fromModule}, attributed ${a.introducedByLessonId ?? "—"})`,
          ),
        ].join("\n"),
      );
    }
    expect(stuck.length).toBeLessThanOrEqual(MAX_GRADED_NEVER_UNLOCKABLE);
  });
});

import { describe, expect, it } from "vitest";
// Importing mockLessons registers the `__lingo_get_lesson_content__` global
// the index uses to resolve lesson content (cycle-avoidance pattern).
import { getMockLessonContent, getAvailableMockLessonIds } from "./mockLessons";
import { getAtomsForLesson } from "./lessonAtomIndex";

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
        // exists; this check is about the DERIVED attributions only.
        if (atom.introducedByLessonId) continue;
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

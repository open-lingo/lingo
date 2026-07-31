import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { JA_COURSE_ATOMS, isSrsEligibleAtom } from "../courseAtoms";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import {
  isDedicatedReviewLesson,
  shouldWriteContentReviewAtom,
} from "@/features/lesson/data/reviewTailSrs";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";

/**
 * AUTHORED-EXPOSURE AUDIT (B065).
 *
 * How many words does the course teach and then never ask about again in
 * AUTHORED content? Measured 2026-07-29 by walking the live JA map in learner
 * order and counting graded steps whose `exercisedAtoms` name each atom.
 *
 * Read the numbers carefully — the earlier B065 filing got this wrong twice:
 *
 *  - **"Never graded" means never in AUTHORED content** — and on the live map
 *    that is the whole story for lessons: the 73 `ja-mN-neo-review-*` lessons
 *    are STATIC IR-compiled lessons, not the dynamic `buildSrsReviewLesson`
 *    builder (only the `ja-mN-review-1/2` id shape routes there, and no live
 *    lesson carries it — verified 2026-07-29, independent review D1). The one
 *    live surface that can still reach a never-graded word is the flashcard
 *    course deck — IF the word is unlocked, which the never-touched set and
 *    the B068 set are not.
 *
 * `EXPOSURE_REPORT=1 npx vitest run atomExposureAudit` dumps the full list to
 * /tmp/ja-atom-exposure.txt for content work.
 */

/** Ratchet. Authoring reps for these words is the only way this may move.
 *  220 → 204 on 2026-07-29: m11 vocab packs 1-2 (B067) — weekdays + あさって
 *  (ja-m11-neo-10) and the wider calendar + おぼえる/はじめて (ja-m11-neo-11).
 *  204 → 196 on 2026-07-29: m13 vocab pack 3 (B067) — the morning routine
 *  (ja-m13-neo-10): おきる/あらう/みがく/せっけん/シャワー/ゆうべ/けさ/早い.
 *  196 → 188 on 2026-07-29: m14 vocab pack 4 (B067) — doors and lights
 *  (ja-m14-neo-10): あける/しめる/もつ/ひく/ドア/でんき/つめたい.
 *  188 → 173 on 2026-07-30: m16 vocab packs 5-6 (B067) — the classroom
 *  (ja-m16-neo-10): かく/よむ/つかう/ノート/きょうしつ/クラス/いみ/やさしい, and
 *  habits and health (ja-m16-neo-11): すう/たばこ/はしる/スポーツ/わるい/よわい/
 *  たいせつ. */
const MAX_NEVER_GRADED = 173;
/**
 * The sharper number: atoms the live course does not TOUCH — no graded step, no
 * teach step, their surface not even present as text in any live lesson. These
 * are words the rewrite has not re-taught, so they are not unlocked either, and
 * an unlocked-only surface (flashcard deck, dynamic review pool) cannot reach
 * them at all. ~80 of them are CEJC top-500 spoken-Japanese words.
 *
 * Detector (three-way, hardened 2026-07-29 after the independent audit): atom
 * id verbatim, every kana variant (split on /、), every kanji variant. Known
 * blind spot: a single-kana word (は/歯) reads as "present" because the
 * particle は is everywhere — the kana detector cannot see that word's absence.
 * Scope: this walks LESSON content only. `grammarReviewPools.ts`, the reading
 * passages, and the placement bank are separate live surfaces (see the audit
 * doc §5.2).
 */
/* 96 → 91 on 2026-07-29: m11 vocab packs 1-2 (B067).
 * 91 → 90 on 2026-07-29: m13 vocab pack 3 (B067). Net −1 only: the pack
 * removed its five untouched words, but the registry re-homes reshuffled the
 * seeded distractor fill, and four words whose only "touch" was
 * distractor-fill luck fell back in — "touched" was never a taught-status
 * signal for those.
 * 90 → 82 on 2026-07-29: m14 vocab pack 4 (B067).
 * 82 → 71 on 2026-07-30: m16 vocab packs 5-6 (B067). */
const MAX_NEVER_TOUCHED = 71;
/** Graded somewhere, but every exposure is blocked by the D2 same-module gate.
 *  19 of these are m30 atoms, which is structural: m30 is the last module, so
 *  there is no later module whose lessons could review them. */
const MAX_GRADED_BUT_NEVER_WRITES = 37;

type Row = {
  atomId: string;
  kana: string;
  kanji?: string;
  from: string;
  graded: number;
  writes: number;
  /** Its surface does not appear ANYWHERE in any live lesson's steps. */
  untouched: boolean;
};

function audit(): Row[] {
  const course = getMockCourse("ja");
  const liveModules = new Set(course.modules.map((m) => m.id));
  const hits = new Map<string, { lessonId: string; writes: boolean }[]>();
  const corpus: string[] = [];

  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const content = getMockLessonContent(lesson.id);
      if (!content) continue; // conjugation-trainer tiles carry no steps
      corpus.push(JSON.stringify(content.steps));
      const isReview = isDedicatedReviewLesson(lesson.id);
      for (const step of content.steps) {
        const ex = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        if (!isGradedStep(step) || ex.length === 0) continue;
        for (const raw of ex) {
          const atomId = raw.replace(/^ja:/, "");
          const list = hits.get(atomId) ?? [];
          if (list[list.length - 1]?.lessonId !== lesson.id) {
            list.push({
              lessonId: lesson.id,
              writes: isReview || shouldWriteContentReviewAtom(atomId, lesson.id),
            });
          }
          hits.set(atomId, list);
        }
      }
    }
  }

  // Three independent presence detectors. A variant field like "いい / よい"
  // or "本当/ほんとう" must be split, or neither variant can ever match.
  const splitVariants = (s: string | undefined): string[] =>
    (s ?? "")
      .split(/[/、,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  const touched = (a: (typeof JA_COURSE_ATOMS)[number]): boolean => {
    const needles = [
      `"${a.id}"`,
      `"ja:${a.id}"`,
      ...splitVariants(a.kana),
      ...splitVariants(a.kanji),
    ];
    return corpus.some((text) => needles.some((n) => text.includes(n)));
  };

  return JA_COURSE_ATOMS.filter(
    (a) => isSrsEligibleAtom(a) && liveModules.has(a.fromModule),
  ).map((a) => {
    const list = hits.get(a.id) ?? [];
    return {
      atomId: a.id,
      kana: a.kana,
      kanji: a.kanji,
      from: a.fromModule,
      graded: list.length,
      writes: list.filter((h) => h.writes).length,
      untouched: list.length === 0 && !touched(a),
    };
  });
}

describe("authored exposure per atom (B065)", () => {
  const rows = audit();

  it("has a population worth auditing — guards the instrument, not the content", () => {
    // An empty or tiny result here means the walk broke (renamed lesson ids, a
    // course-map change), and every assertion below would pass vacuously.
    expect(rows.length).toBeGreaterThan(600);
    expect(rows.filter((r) => r.graded > 0).length).toBeGreaterThan(400);
  });

  it("never-graded count only goes DOWN", () => {
    const never = rows.filter((r) => r.graded === 0);
    if (process.env.EXPOSURE_REPORT) {
      const byMod = new Map<string, Row[]>();
      for (const r of never) byMod.set(r.from, [...(byMod.get(r.from) ?? []), r]);
      writeFileSync(
        "/tmp/ja-atom-exposure.txt",
        [
          `never graded in authored content: ${never.length} / ${rows.length}`,
          ...[...byMod.entries()]
            .sort((a, b) => parseModuleIndex(a[0]) - parseModuleIndex(b[0]))
            .flatMap(([m, list]) => [
              "",
              `## ${m} (${list.length})`,
              ...list.map((r) => `${r.kana}${r.kanji ? `(${r.kanji})` : ""}\t${r.atomId}`),
            ]),
        ].join("\n"),
      );
    }
    expect(never.length).toBeLessThanOrEqual(MAX_NEVER_GRADED);
  });

  it("never-touched count only goes DOWN", () => {
    // Stricter than never-graded, and the number that matters for coverage: the
    // live course does not use these words at all, so nothing unlocks them and
    // no unlocked-only surface (deck, dynamic review pool) can reach them
    // either. Teaching one is an IR edit — see the audit doc's slot-in plan.
    const untouched = rows.filter((r) => r.untouched);
    if (process.env.EXPOSURE_REPORT) {
      writeFileSync(
        "/tmp/ja-atom-untouched.txt",
        [
          `never touched by any live lesson: ${untouched.length} / ${rows.length}`,
          ...untouched.map(
            (r) => `${r.kana}${r.kanji ? `(${r.kanji})` : ""}\t${r.atomId}\t(legacy ${r.from})`,
          ),
        ].join("\n"),
      );
    }
    expect(untouched.length).toBeLessThanOrEqual(MAX_NEVER_TOUCHED);
  });

  it("graded-but-never-advances-FSRS count only goes DOWN", () => {
    const stuck = rows.filter((r) => r.graded > 0 && r.writes === 0);
    expect(stuck.length).toBeLessThanOrEqual(MAX_GRADED_BUT_NEVER_WRITES);
  });
});

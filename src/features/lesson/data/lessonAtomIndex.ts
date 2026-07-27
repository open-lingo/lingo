import {
  JA_COURSE_ATOMS,
  isSrsEligibleAtom,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";
import {
  isLanguageRegistered,
  tryGetLanguageModule,
} from "@/shared/language/registry";
import {
  getNormalizedAtomIndex,
  getNormalizedCourseAtoms,
  type NormalizedAtom,
} from "./normalizedAtoms";

/**
 * Lesson → atoms index. Routes through the central language registry
 * per ADR-005.
 *
 * This file still hands callers (`buildSrsReviewLesson`,
 * `unlockLessonAtoms`, `seedSchedule`) the JA-internal `CourseAtom`
 * shape — they read kana / kanji / emoji / fromModule. Non-JA languages
 * are served through the normalized atom view (`normalizedAtoms.ts`)
 * adapted into that same field layout (`kana` = display surface,
 * `meaningEn` = gloss), with CANONICAL ids (`es:hola`) so the SRS and
 * unlock stores key correctly without the legacy `ja:` default prefix.
 *
 * Attribution sources differ per language:
 *   - JA: per-atom `introducedByLessonId` (static index) with the M8+
 *     surface-mining fallback below.
 *   - ES/KO: lesson steps carry `exercisedAtoms` (canonical atom ids,
 *     resolved at authoring time by the language grammar helpers); a
 *     lesson introduces the exercised atoms attributed to its own module.
 */
const lessonToAtoms = new Map<string, CourseAtom[]>();

for (const atom of JA_COURSE_ATOMS) {
  if (!isSrsEligibleAtom(atom)) continue;
  const lid = atom.introducedByLessonId;
  if (!lid) continue;
  const arr = lessonToAtoms.get(lid) ?? [];
  arr.push(atom);
  lessonToAtoms.set(lid, arr);
}

/**
 * Lesson content is resolved through the `__lingo_get_lesson_content__`
 * global registered by mockLessons — same cycle-avoidance pattern as
 * `__lingo_row_sub_lesson_ids__`.
 */
type LessonContentLookup = (
  id: string,
) => { steps: unknown[]; moduleId?: string } | null;

function getLessonContentLookup(): LessonContentLookup | undefined {
  const lookup = (
    globalThis as { __lingo_get_lesson_content__?: LessonContentLookup }
  ).__lingo_get_lesson_content__;
  return typeof lookup === "function" ? lookup : undefined;
}

/**
 * M8+ fallback (2026-06-12 attribution backfill): JA content sub-lessons in
 * m8..m27 carry module-level attribution (`fromModule`) but no per-atom
 * `introducedByLessonId`. For a lesson absent from the static index,
 * derive its atoms as "the lesson's module's attributed atoms whose
 * surface form (kana or kanji) appears in the lesson's steps".
 */
const fallbackAtomsCache = new Map<string, CourseAtom[]>();

function atomSurfaces(atom: CourseAtom): string[] {
  const out = atom.kana.split("/").map((s) => s.trim());
  if (atom.kanji) out.push(...atom.kanji.split("/").map((s) => s.trim()));
  return out.filter(Boolean);
}

function fallbackAtomsForLesson(lessonId: string): CourseAtom[] {
  const cached = fallbackAtomsCache.get(lessonId);
  if (cached) return cached;
  // SRS review lessons re-surface already-unlocked atoms — never a source
  // of new introductions.
  const moduleId = /^ja-(m\d+)-(?!review-)/.exec(lessonId)?.[1] ?? null;
  const getContent = getLessonContentLookup();
  let atoms: CourseAtom[] = [];
  if (moduleId && getContent) {
    const lesson = getContent(lessonId);
    if (lesson) {
      const candidates = JA_COURSE_ATOMS.filter(
        (a) =>
          isSrsEligibleAtom(a) &&
          a.fromModule === moduleId &&
          !a.introducedByLessonId,
      );

      // EXACT FIRST. The compiler already decided which atoms a step exercises
      // — that is what `exercisedAtoms` IS, and its tiles are the tokenizer's
      // own segmentation. Ask them.
      const exercised = new Set<string>();
      const tiled = new Set<string>();
      for (const step of lesson.steps) {
        const s = step as unknown as { exercisedAtoms?: string[]; tiles?: string[] };
        for (const id of s.exercisedAtoms ?? []) exercised.add(id);
        for (const t of s.tiles ?? []) tiled.add(t);
      }
      atoms = candidates.filter(
        (a) => exercised.has(a.id) || atomSurfaces(a).some((s) => tiled.has(s)),
      );

      // SUBSTRING ONLY AS A LAST RESORT — and it is wrong often enough that it
      // may never be the first resort. This used to be
      // `JSON.stringify(lesson.steps).includes(surface)`, which matches a
      // surface ANYWHERE: inside another word, inside the English gloss, inside
      // a step id. Measured across m8+, it attributed 184 atoms where exact
      // matching attributes 80, and every single difference was an artefact:
      //   くる "come"  credited from くるま "car"
      //   とし "year"  credited from としょかん "library"
      //   はん "half"  credited from ごはん "meal"
      //   いま "now"   credited from います "exists"
      //   いい "good"  credited from いいえ "no"
      // Each one schedules an atom in a lesson that never taught it, which is
      // silent: the lesson renders correctly and the learner simply starts
      // getting reviews for a word they have not met. The eighth distinct
      // substring-on-Japanese bug in this repo.
      //
      // A handful of lessons carry no tiles and no exercisedAtoms at all
      // (rule-card-only shapes). For those there is no better evidence, so the
      // old behaviour is kept rather than silently attributing nothing.
      if (!exercised.size && !tiled.size) {
        const haystack = JSON.stringify(lesson.steps);
        atoms = candidates.filter((a) =>
          atomSurfaces(a).some((s) => haystack.includes(s)),
        );
      }
    }
  }
  fallbackAtomsCache.set(lessonId, atoms);
  return atoms;
}

/**
 * Adapt a normalized atom into the `CourseAtom` field layout the index's
 * callers read. Ids stay canonical; `excludeFromSrs` inverts `srsEligible`
 * so `isSrsEligibleAtom`-filtering callers (seedSchedule) stay honest.
 */
function toCourseAtomView(atom: NormalizedAtom): CourseAtom {
  return {
    id: atom.id,
    kana: atom.display,
    kanji: atom.secondary,
    romaji: atom.romanization ?? atom.display,
    meaningEn: atom.gloss,
    emoji: atom.emoji,
    fromModule: atom.module as CourseAtom["fromModule"],
    kind: atom.kind === "other" ? "vocab" : atom.kind,
    excludeFromSrs: atom.srsEligible ? undefined : true,
  };
}

const nonJaLessonAtomsCache = new Map<string, CourseAtom[]>();

function nonJaAtomsForLesson(
  lessonId: string,
  languageId: string,
): CourseAtom[] {
  const cacheKey = `${languageId}:${lessonId}`;
  const cached = nonJaLessonAtomsCache.get(cacheKey);
  if (cached) return cached;
  const atoms: CourseAtom[] = [];
  const lesson = getLessonContentLookup()?.(lessonId);
  if (lesson) {
    const index = getNormalizedAtomIndex(languageId);
    const seen = new Set<string>();
    for (const step of lesson.steps as Array<{ exercisedAtoms?: string[] }>) {
      for (const id of step?.exercisedAtoms ?? []) {
        if (seen.has(id)) continue;
        seen.add(id);
        const atom = index.get(id);
        // Introduction semantics mirror the JA fallback: a lesson only
        // introduces atoms attributed to its own module — earlier-module
        // vocab re-drilled here must not re-claim introduction.
        if (atom && atom.srsEligible && atom.module === lesson.moduleId) {
          atoms.push(toCourseAtomView(atom));
        }
      }
    }
  }
  nonJaLessonAtomsCache.set(cacheKey, atoms);
  return atoms;
}

/**
 * Callers that predate multi-language (LessonPage's unlock + seed path)
 * pass only the lesson id. Lesson ids are language-prefixed (`ja-m1-l1`,
 * `es-m1-3`, `ko-m3-1`), so infer the language rather than defaulting
 * non-JA lessons into the JA index (where they'd silently resolve to
 * zero atoms). An explicit `languageId` always wins.
 */
function languageForLessonId(lessonId: string): string {
  const prefix = /^([a-z]+)-/.exec(lessonId)?.[1];
  return prefix && isLanguageRegistered(prefix) ? prefix : "ja";
}

export function getAtomsForLesson(
  lessonId: string,
  languageId?: string,
): CourseAtom[] {
  const lang = languageId ?? languageForLessonId(lessonId);
  if (!isLanguageRegistered(lang)) return [];
  if (lang !== "ja") return nonJaAtomsForLesson(lessonId, lang);
  return lessonToAtoms.get(lessonId) ?? fallbackAtomsForLesson(lessonId);
}

export function getAtomsUpToModule(
  moduleId: string,
  languageId: string = "ja",
): CourseAtom[] {
  // Module order derived from the language module's curriculum, not
  // hardcoded m1..m7.
  const module = tryGetLanguageModule(languageId);
  if (!module) return [];
  const order = module.curriculum.map((m) => m.id);
  const cutoff = order.indexOf(moduleId);
  if (cutoff === -1) return [];
  const set = new Set(order.slice(0, cutoff + 1));
  if (languageId === "ja") {
    return JA_COURSE_ATOMS.filter(
      (a) => isSrsEligibleAtom(a) && set.has(a.fromModule),
    );
  }
  return getNormalizedCourseAtoms(languageId)
    .filter((a) => a.srsEligible && set.has(a.module))
    .map(toCourseAtomView);
}

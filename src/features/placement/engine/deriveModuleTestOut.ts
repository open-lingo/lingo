import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";

/**
 * Test-out authoring by DERIVATION, not hand-curation.
 *
 * A module's test-out is a representative sample of the module's OWN, already
 * vetted lesson questions — ~10 gradable steps that collectively touch every
 * skill section the module teaches (dupes allowed), with format variety.
 * Human effort drops to a per-module spot-check of the picked 10.
 *
 * Coverage is keyed on the module's sub-lesson **sections** (finer than the
 * grammar-rule-card `grammarPointId` tags, which collapse sub-skills like
 * te-form Group 1/2, た-form, and counters into one point), so the widest
 * modules stay fully covered without retagging curriculum.
 */

/** Formats allowed in a test-out. "Add listening" = tap/type + listening,
 *  but NOT speaking/dialogue (mic) or symbol/kana drills. */
export const TESTOUT_FORMATS: ReadonlySet<string> = new Set([
  "multiple_choice",
  "particle_cloze",
  "build_sentence",
  "translate",
  "fill_blank",
  "word_image_mcq",
  "self_explanation_mcq",
  "match_pairs",
  "listening_comprehension",
  "listening_build",
]);

export const TESTOUT_SIZE = 10;

export type DerivedItem = {
  step: LessonStep;
  lessonId: string;
  /** The skill section this question belongs to (coverage key). */
  section: string;
  /** grammarPointId of the section's rule card, if one is tagged (label only). */
  grammarPointId?: string;
  format: string;
};

/** Section key from a lesson id: `ja-m14-5-1-...` → `m14-5`; katakana/other
 *  lessons (`ja-m10kata-...`) fall back to the whole lesson id. */
function sectionOf(lessonId: string): string {
  const m = /^ja-(m\d+)-(\d+)/.exec(lessonId);
  return m ? `${m[1]}-${m[2]}` : lessonId.replace(/^ja-/, "");
}

export function collectGradable(
  moduleId: string,
  formats: ReadonlySet<string> = TESTOUT_FORMATS,
): DerivedItem[] {
  const course = getMockCourse("ja");
  const mod = course.modules.find((m) => m.id === moduleId);
  if (!mod) return [];
  const out: DerivedItem[] = [];
  for (const lesson of mod.lessons as Array<{ id: string }>) {
    const content = getMockLessonContent(lesson.id);
    if (!content) continue;
    let grammarPointId: string | undefined;
    for (const s of content.steps as LessonStep[]) {
      const st = s as LessonStep & { grammarPointId?: string };
      if (st.type === "grammar_rule" && st.grammarPointId) {
        grammarPointId = st.grammarPointId;
      }
      if (formats.has(st.type)) {
        out.push({
          step: s,
          lessonId: lesson.id,
          section: sectionOf(lesson.id),
          grammarPointId,
          format: st.type,
        });
      }
    }
  }
  return out;
}

/**
 * Greedy coverage pick: guarantee one question per section first, then fill to
 * `size` preferring an unseen format and an under-represented section. Stable
 * (no RNG) so the same module always yields the same test-out until content
 * changes. Dupes only if the module has fewer than `size` questions.
 */
export function pickCovering(
  items: DerivedItem[],
  size: number = TESTOUT_SIZE,
): DerivedItem[] {
  if (items.length === 0) return [];
  const sections = [...new Set(items.map((i) => i.section))];
  const chosen: DerivedItem[] = [];
  const usedIds = new Set<string>();
  const take = (it: DerivedItem | undefined) => {
    if (!it) return;
    chosen.push(it);
    usedIds.add((it.step as { id: string }).id);
  };

  // Round 1: one representative per section (middle item = past the intro).
  for (const sec of sections) {
    const pool = items.filter((i) => i.section === sec);
    take(pool[Math.floor(pool.length / 2)]);
    if (chosen.length >= size) return chosen.slice(0, size);
  }

  // Rounds 2+: fill to size, cycling sections (cursor advances every step so
  // an exhausted section is skipped, not retried), preferring a NEW format.
  const usedFormats = new Set(chosen.map((c) => c.format));
  let cursor = 0;
  let guard = 0;
  while (chosen.length < size && guard++ < items.length * 3) {
    const sec = sections[cursor % sections.length];
    cursor++;
    const pool = items.filter(
      (i) => i.section === sec && !usedIds.has((i.step as { id: string }).id),
    );
    if (pool.length === 0) continue;
    const fresh = pool.find((p) => !usedFormats.has(p.format)) ?? pool[0];
    take(fresh);
    usedFormats.add(fresh.format);
  }

  return chosen.slice(0, size);
}

export type DerivedTestOut = {
  moduleId: string;
  steps: LessonStep[];
  items: DerivedItem[];
  sectionsCovered: number;
  sectionsTotal: number;
  formats: string[];
};

/** Derive a module's ~10-question test-out from its own lessons. */
export function deriveModuleTestOut(
  moduleId: string,
  opts: { size?: number; formats?: ReadonlySet<string> } = {},
): DerivedTestOut {
  const all = collectGradable(moduleId, opts.formats ?? TESTOUT_FORMATS);
  const picked = pickCovering(all, opts.size ?? TESTOUT_SIZE);
  const sectionsTotal = new Set(all.map((i) => i.section)).size;
  return {
    moduleId,
    steps: picked.map((p) => p.step),
    items: picked,
    sectionsCovered: new Set(picked.map((p) => p.section)).size,
    sectionsTotal,
    formats: [...new Set(picked.map((p) => p.format))],
  };
}

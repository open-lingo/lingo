import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import type { PlacementItemConfig } from "../questionBank";

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
 *  but NOT speaking/dialogue (mic) or symbol/kana drills. Cross-language:
 *  the ES course's graded step types (sentence/word-image MCQ, cloze,
 *  build, listening variants) are all already listed here; its remaining
 *  types (speaking, info, phrase_card) are mic-gated or passive and stay
 *  excluded.
 *
 *  `translate` is EXCLUDED — Spencer 2026-08-18: *"we dont want to include
 *  the type translate step in ANY test out feature. its too complicated and
 *  not forgiving enough for something they mostly know and dont need a full
 *  re-study of."* A test-out asks "do you already have this?", and free-text
 *  production is the wrong instrument for that question: it grades spelling,
 *  particle spacing, and register choice all at once, so a learner who knows
 *  the grammar can still fail on a synonym the acceptedAnswers list never
 *  anticipated. Every other format here has a bounded answer space. The
 *  same step type stays legal in LESSONS, where a miss costs a retry rather
 *  than a whole module's credit.
 *
 *  Excluding it costs nothing measurable: across ja/ko/es (74 modules with
 *  a derivable pool) it removes 1–15 items per module, and NO module drops
 *  below TESTOUT_DERIVED_FLOOR or loses a skill section — the thinnest pool
 *  left is 25 items against a TESTOUT_SIZE of 12. Guarded by
 *  `deriveModuleTestOut.test.ts`. */
export const TESTOUT_FORMATS: ReadonlySet<string> = new Set([
  "multiple_choice",
  "particle_cloze",
  "build_sentence",
  "fill_blank",
  "word_image_mcq",
  "self_explanation_mcq",
  "match_pairs",
  "listening_comprehension",
  "listening_build",
]);

// 12 per Spencer QA 2026-07-13: "aiming for like 12-15 pulled from the
// lesson highlighting the vocab and/or grammar" (was 10).
export const TESTOUT_SIZE = 12;

/**
 * Minimum derived-set size for a module's test-out to be served from the
 * derived path. Below this the course is too thin to sample from (stub
 * modules, or lessons whose steps fall outside TESTOUT_FORMATS) and a
 * "test-out" of a handful of questions can't honestly credit a module —
 * callers fall back to the authored placement bank instead. 8 keeps the
 * 100%-pass bar meaningful while sitting under TESTOUT_SIZE (12), so a
 * near-full derivation still qualifies.
 */
export const TESTOUT_DERIVED_FLOOR = 8;

export type DerivedItem = {
  step: LessonStep;
  lessonId: string;
  /** The skill section this question belongs to (coverage key). */
  section: string;
  /** grammarPointId of the section's rule card, if one is tagged (label only). */
  grammarPointId?: string;
  format: string;
};

/** Section key from a lesson id: `ja-m14-5-1-...` → `m14-5`, `es-m10-6` →
 *  `m10-6`, `ko-m3-1` → `m3-1`; katakana/other lessons (`ja-m10kata-...`)
 *  fall back to the lesson id minus the language prefix. (Both parity
 *  branches converged on this shape — prefix-strip beats a dynamic regex.) */
function sectionOf(lessonId: string, languageId: string): string {
  const bare = lessonId.startsWith(`${languageId}-`)
    ? lessonId.slice(languageId.length + 1)
    : lessonId;
  const m = /^(m\d+)-(\d+)/.exec(bare);
  return m ? `${m[1]}-${m[2]}` : bare;
}

export function collectGradable(
  moduleId: string,
  formats: ReadonlySet<string> = TESTOUT_FORMATS,
  languageId: string = "ja",
): DerivedItem[] {
  const course = getMockCourse(languageId);
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
          section: sectionOf(lesson.id, languageId),
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
 * `size` preferring an unseen format and an under-represented section.
 *
 * **Without `rng`** the pick is stable (no RNG) — the same module always yields
 * the same test-out until content changes (Round 1 takes each section's middle
 * item; existing tests + the memoized live path rely on this).
 *
 * **With `rng`** each round samples randomly (a random representative per
 * section, random unused fills still preferring an unseen format, final order
 * shuffled), so each seeded attempt draws a different subset from the full
 * gradable pool — the anti-memorization mechanism. `rng` is a `() => number`
 * in [0, 1); seed it once per attempt for a stable-within-attempt draw.
 *
 * Dupes only if the module has fewer than `size` questions.
 */
export function pickCovering(
  items: DerivedItem[],
  size: number = TESTOUT_SIZE,
  rng?: () => number,
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
  const pickFrom = (pool: DerivedItem[], preferMiddle: boolean): DerivedItem =>
    rng
      ? pool[Math.floor(rng() * pool.length)]
      : preferMiddle
        ? pool[Math.floor(pool.length / 2)]
        : pool[0];

  // Round 1: one representative per section (deterministic = middle item past
  // the intro; seeded = a random item from the section).
  for (const sec of sections) {
    const pool = items.filter((i) => i.section === sec);
    take(pickFrom(pool, true));
    if (chosen.length >= size) break;
  }
  if (chosen.length >= size) {
    return finishPick(chosen, size, rng);
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
    const unseenFormat = pool.filter((p) => !usedFormats.has(p.format));
    const fresh =
      unseenFormat.length > 0
        ? pickFrom(unseenFormat, false)
        : pickFrom(pool, false);
    take(fresh);
    usedFormats.add(fresh.format);
  }

  return finishPick(chosen, size, rng);
}

/** Trim to size, and (seeded only) shuffle the final order so a retry doesn't
 *  re-serve the same section sequence. Deterministic path keeps its order. */
function finishPick(
  chosen: DerivedItem[],
  size: number,
  rng?: () => number,
): DerivedItem[] {
  const trimmed = chosen.slice(0, size);
  if (!rng) return trimmed;
  for (let i = trimmed.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [trimmed[i], trimmed[j]] = [trimmed[j], trimmed[i]];
  }
  return trimmed;
}

export type DerivedTestOut = {
  moduleId: string;
  steps: LessonStep[];
  items: DerivedItem[];
  sectionsCovered: number;
  sectionsTotal: number;
  formats: string[];
};

/**
 * Live-route adapter: the derived set wrapped as PlacementItemConfigs so
 * the adaptive engine's test-out flow serves REAL lesson steps instead of
 * the legacy 3-per-module bank (Spencer QA 2026-07-13: "needed more than
 * 3 questions, we were aiming for like 12-15 pulled from the lesson").
 * Memoized — derivation walks every lesson in the module. Config id ===
 * step.id (grading + served-dedupe contract, see DerivedStepConfig).
 */
const testOutConfigCache = new Map<string, PlacementItemConfig[]>();

/**
 * Live-route adapter. With no `rng`, returns the memoized stable set (per
 * language + module). With an `rng`, bypasses the cache and returns a fresh
 * randomized draw from the full gradable pool — so each test-out ATTEMPT
 * serves a different subset (anti-memorization; `PlacementTestPage` seeds one
 * `rng` per attempt).
 */
export function getDerivedTestOutItems(
  moduleId: string,
  languageId: string = "ja",
  rng?: () => number,
): PlacementItemConfig[] {
  // Courses share module ids ("m5" exists in JA and ES), so the cache is
  // keyed per language.
  const cacheKey = `${languageId}:${moduleId}`;
  if (!rng) {
    const cached = testOutConfigCache.get(cacheKey);
    if (cached) return cached;
  }
  const derived = deriveModuleTestOut(moduleId, { languageId, rng });
  const configs: PlacementItemConfig[] = derived.items.map((it) => ({
    id: it.step.id,
    moduleId,
    languageId,
    grammarPointId: it.grammarPointId ?? it.section,
    skill: it.grammarPointId ?? it.section,
    type: "derivedStep",
    step: it.step,
  }));
  if (!rng) testOutConfigCache.set(cacheKey, configs);
  return configs;
}

/** Derive a module's test-out from its own lessons (~TESTOUT_SIZE steps). */
export function deriveModuleTestOut(
  moduleId: string,
  opts: {
    size?: number;
    formats?: ReadonlySet<string>;
    languageId?: string;
    rng?: () => number;
  } = {},
): DerivedTestOut {
  const languageId = opts.languageId ?? "ja";
  const size = opts.size ?? TESTOUT_SIZE;
  const all = collectGradable(
    moduleId,
    opts.formats ?? TESTOUT_FORMATS,
    languageId,
  );
  // Flag thin modules (e.g. KO script m1/m2) where the pool is too small for
  // the varied-draw to actually vary — surfaces the gap instead of silently
  // serving near-identical retries. Dev-only.
  if (
    import.meta.env?.DEV &&
    all.length > 0 &&
    all.length < 2 * size
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      `[test-out] ${languageId} ${moduleId}: thin gradable pool ` +
        `(${all.length} < ${2 * size}) — varied test-out retries will overlap heavily.`,
    );
  }
  const picked = pickCovering(all, size, opts.rng);
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

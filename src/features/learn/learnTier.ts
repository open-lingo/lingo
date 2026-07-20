import type { Course, CourseModule } from "@/shared/domain/course";
import { getCurrentModuleIndex } from "@/features/learn/moduleProgress";

/**
 * Course tier — pure helpers backing the TransitLearnPage tier switcher
 * (Spencer 2026-07-17: "the learn page has no way to get to the next zone
 * set/n4 area. the page should default to the area they are on.").
 *
 * Kept dependency-free of React/DOM so it's cheaply unit-testable — the map
 * component itself (ResizeObserver, rAF rides, drag/scroll) is too heavy for
 * happy-dom, so all the tier DECISION logic lives here instead.
 */
export type LearnTier = "n5" | "n4";

const moduleTier = (m: CourseModule): LearnTier => m.tier ?? "n5";

/** Whether the course has any module tagged with this tier at all. es/ko
 *  courses (no n4 content yet) → false, which is the switcher's render gate. */
export function courseHasTier(course: Course, tier: LearnTier): boolean {
  return course.modules.some((m) => moduleTier(m) === tier);
}

/** Drawable modules for one tier, in course order, parameterized so each
 *  tier gets its own map + own ZONE 1/2/3 split (buildLayout thirds-splits
 *  whatever module list it's given).
 *
 *  2026-07-19 (rewrite spine): `comingSoon` modules are now DRAWN — the
 *  dict-form-first spine ships m4-m29 as visible-but-locked stations so the
 *  new course shape is navigable before its content is authored
 *  (getModuleStatus renders them locked; DistrictView shows the
 *  coming-soon note). Lesson-less modules WITHOUT the flag are still
 *  filtered — that's the "unshipped language" stub case, not a planned
 *  station. */
export function modulesForTier(course: Course, tier: LearnTier): CourseModule[] {
  return course.modules.filter(
    (m) => (m.comingSoon || m.lessons.length > 0) && moduleTier(m) === tier,
  );
}

/**
 * Progress-derived default tier: the tier of the learner's current module
 * (first with an incomplete lesson, across the FULL course — not one
 * tier's filtered list, so a learner who has graduated N5 and started on
 * m29+ defaults straight to the N4 line).
 *
 * Courses with no n4 content always default (and stay) on n5.
 */
export function deriveDefaultTier(
  course: Course,
  completedLessonIds: ReadonlySet<string>,
): LearnTier {
  if (!courseHasTier(course, "n4")) return "n5";
  if (course.modules.length === 0) return "n5";
  // A comingSoon module is a real frontier (rewrite spine: content pending),
  // not a completed step — without this, a learner who finished everything
  // authored in n5 would "skip past" the empty spine and default onto the
  // N4 line even though their course position is mid-N5.
  const frontier = course.modules.findIndex(
    (m) => m.comingSoon || m.lessons.some((l) => !completedLessonIds.has(l.id)),
  );
  const idx = frontier >= 0 ? frontier : getCurrentModuleIndex(course, completedLessonIds);
  const mod = course.modules[idx] ?? course.modules[0];
  return moduleTier(mod);
}

const isTier = (v: unknown): v is LearnTier => v === "n5" || v === "n4";

/** Parse a `?tier=` query-param value; anything else (missing, garbage) → null. */
export function parseTierParam(value: string | null): LearnTier | null {
  return isTier(value) ? value : null;
}

const storageKey = (courseId: string) => `lingo:learn-tier:${courseId}`;

/** Persisted tier choice, per course id — mirrors `useLearnViewMode`'s
 *  `lingo:learn-view:<lang>` key convention. SSR/private-mode safe. */
export function readStoredTier(courseId: string): LearnTier | null {
  try {
    const v = localStorage.getItem(storageKey(courseId));
    return isTier(v) ? v : null;
  } catch {
    return null;
  }
}

export function writeStoredTier(courseId: string, tier: LearnTier): void {
  try {
    localStorage.setItem(storageKey(courseId), tier);
  } catch {
    /* private mode — session-only */
  }
}

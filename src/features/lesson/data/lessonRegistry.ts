import type { LessonContent } from "../types";

/**
 * The lesson registry: the one in-memory table every lesson read goes
 * through (`mockLessons.getRawMockLesson` / `getMockLessonContent`).
 *
 * Content-as-data (2026-09-13). Until this file existed the whole curriculum
 * — four courses, ~1,540 lessons — was a static import graph rooted at
 * `mockLessons.ts`, so the browser evaluated all of it (the Japanese half by
 * running `compileModule` 41 times) before the Home screen could paint:
 * 3.3 s of main-thread time on an iPhone 15 Pro Max, on every cold open.
 * Now the table starts EMPTY in the browser and is filled from per-module
 * JSON files (`src/pub/content/v1/**`, emitted at build time from the same
 * sources — see `contentLoader.ts` and `scripts/content/`), so the Home
 * path never touches lesson bodies and a lesson page loads exactly the
 * modules it needs.
 *
 * Two populators, never both in one runtime:
 *   - `contentLoader.ts` — the browser: fetch JSON, `registerLessons`.
 *   - `lessonRegistry.eager.ts` — tests and the content emitter: the old
 *     static import block, registered synchronously at import so the 129
 *     curriculum test files (and anything calling
 *     `getAvailableMockLessonIds()` expecting the FULL registry) keep working
 *     unchanged. It reaches the browser bundle NEVER: `mockLessons.ts`
 *     imports it through `virtual:lesson-registry-bootstrap`, which the
 *     Vite plugin of the same name resolves to the eager file only under
 *     vitest and to an empty module for every real build (`vite.config.ts`).
 *
 * `contentRevision` is a monotonically increasing counter bumped on every
 * registration so React surfaces that built something from the registry
 * (`useContentRevision`) re-render once content lands.
 */

const table: Record<string, LessonContent> = Object.create(null);
let revision = 0;
const listeners = new Set<() => void>();

export function registerLessons(
  lessons: Iterable<LessonContent> | Record<string, LessonContent>,
): number {
  const list = Array.isArray(lessons)
    ? lessons
    : typeof (lessons as Iterable<LessonContent>)[Symbol.iterator] === "function"
      ? [...(lessons as Iterable<LessonContent>)]
      : Object.values(lessons as Record<string, LessonContent>);
  let added = 0;
  for (const lesson of list) {
    if (!lesson || typeof lesson.id !== "string") continue;
    if (!(lesson.id in table)) added++;
    table[lesson.id] = lesson;
  }
  if (added > 0 || list.length > 0) {
    revision++;
    for (const cb of listeners) cb();
  }
  return added;
}

export function getRegisteredLesson(lessonId: string): LessonContent | null {
  return table[lessonId] ?? null;
}

export function hasRegisteredLesson(lessonId: string): boolean {
  return lessonId in table;
}

export function getRegisteredLessonIds(): string[] {
  return Object.keys(table);
}

export function getRegisteredLessons(): LessonContent[] {
  return Object.values(table);
}

/** Current registry revision; changes whenever lessons are registered. */
export function getContentRevision(): number {
  return revision;
}

/**
 * Bump the revision without registering lessons — for loaders that cache
 * their own derived data (e.g. the module vocab index) outside `table` but
 * still need `useContentRevision()` subscribers to re-render once it lands.
 */
export function bumpContentRevision(): void {
  revision++;
  for (const cb of listeners) cb();
}

export function subscribeContent(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Test-only: empty the table (the eager bootstrap re-registers on import). */
export function __clearLessonRegistry(): void {
  for (const k of Object.keys(table)) delete table[k];
  revision++;
}

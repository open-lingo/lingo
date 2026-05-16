/**
 * Vocab graduation — Phase 2 scaffolding.
 *
 * When a module is completed, all anchor words from that module's rows
 * "graduate" — they're snapshotted into the graduation store and a
 * `lingo:vocab-graduated` CustomEvent fires for the flashcards-side
 * receiver (other maintainer) to consume. The receiver isn't wired yet
 * so the dispatch is harmless until they wire it.
 *
 * Idempotency: `graduateModule` checks a per-course flag store and is a
 * no-op if the module has already graduated. The items array is deduped
 * by kana so repeated calls never produce duplicate entries.
 */

import type { CourseModule } from "@/shared/domain/course";
import { ALL_ROWS } from "@/features/lesson/data/hiraganaCurriculum";
import { notifySRSStoreChanged } from "@/features/flashcards/SRSStoreRevisionContext";
import {
  clearStorage,
  getCourseItems,
  isModuleGraduated,
  loadGraduatedModules,
  loadStore,
  markModuleGraduated,
  saveGraduatedModules,
  saveStore,
} from "./storage";
import type { GraduatedItem } from "./types";

export type { GraduatedItem, VocabGraduationStore } from "./types";

/** Public read API — current graduated items for a course. */
export function getGraduatedVocab(courseId: string): GraduatedItem[] {
  return getCourseItems(loadStore(), courseId);
}

/**
 * Parse a lesson id like `ja-m1-{rowId}-{suffix}` (or legacy `ja-m1-{rowId}`)
 * down to its row id. Row ids may contain hyphens (`da-ba`, `yo-sh-ch`,
 * `yo-m-r`) so we strip the trailing `-(\d+|test|recap)` suffix only.
 * Returns null for ids that don't follow the row pattern.
 */
function rowIdFromLessonId(lessonId: string): string | null {
  // Strip JA prefix `ja-m1-` / `ja-m2-` etc.
  const m = /^ja-m\d+-(.+)$/.exec(lessonId);
  if (!m) return null;
  let tail = m[1];
  // Strip the sub-lesson suffix if present.
  const sub = /^(.+)-(\d+|test|recap)$/.exec(tail);
  if (sub) tail = sub[1];
  return tail;
}

/**
 * Collect every anchor word reachable from the lessons of `module`. We
 * walk module.lessons, parse each lesson id to a row id, and union the
 * row's `anchorWords`. Deduped by kana so each kana surface graduates
 * exactly once even if it appears in multiple anchor lists.
 */
function collectModuleAnchorWords(module: CourseModule): GraduatedItem[] {
  const seen = new Set<string>();
  const items: GraduatedItem[] = [];
  const rowsById = new Map(ALL_ROWS.map((r) => [r.id, r]));
  const collectedRowIds = new Set<string>();

  for (const lesson of module.lessons) {
    const rowId = rowIdFromLessonId(lesson.id);
    if (!rowId) continue;
    if (collectedRowIds.has(rowId)) continue;
    collectedRowIds.add(rowId);
    const row = rowsById.get(rowId);
    if (!row) continue;
    for (const w of row.anchorWords) {
      if (seen.has(w.kana)) continue;
      seen.add(w.kana);
      items.push({
        kana: w.kana,
        romaji: w.romaji,
        meaning: w.meaning,
        sourceModuleId: module.id,
        sourceModuleTitle: module.eyebrow ?? module.title,
        unlockedAt: new Date().toISOString(),
      });
    }
  }
  return items;
}

/**
 * Snapshot `module`'s anchor words into the graduation store. Returns
 * the NEW items added (so callers can wire a UI toast / nudge), not the
 * full store contents. Idempotent — re-running for an already-graduated
 * module is a no-op and returns `[]`.
 */
export function graduateModule(
  courseId: string,
  module: CourseModule,
): GraduatedItem[] {
  if (module.comingSoon) return [];
  if (module.lessons.length === 0) return [];

  const modules = loadGraduatedModules();
  if (isModuleGraduated(modules, courseId, module.id)) return [];

  const candidates = collectModuleAnchorWords(module);
  if (candidates.length === 0) {
    // Even with no anchor words, mark the module graduated so we don't
    // re-scan on every page load.
    saveGraduatedModules(markModuleGraduated(modules, courseId, module.id));
    return [];
  }

  const store = loadStore();
  const existing = store[courseId] ?? [];
  const seen = new Set(existing.map((i) => i.kana));
  const added: GraduatedItem[] = [];
  for (const item of candidates) {
    if (seen.has(item.kana)) continue;
    seen.add(item.kana);
    added.push(item);
  }
  if (added.length > 0) {
    store[courseId] = [...existing, ...added];
    saveStore(store);
  }
  saveGraduatedModules(markModuleGraduated(modules, courseId, module.id));
  notifyFlashcardsOfGraduation(added);
  // Bump the SRS revision bus so any consumer of graduated vocab
  // re-renders (no receiver wired yet but the channel is open).
  notifySRSStoreChanged();
  return added;
}

/** Dev tool — wipe the graduation + module-flag stores. */
export function clearGraduatedVocab(courseId?: string): void {
  clearStorage(courseId);
  notifySRSStoreChanged();
}

/**
 * Stub for the flashcards maintainer to override. Currently dispatches a
 * `lingo:vocab-graduated` CustomEvent on the window so a future receiver
 * can subscribe whenever it lands. No-op when items is empty.
 */
export function notifyFlashcardsOfGraduation(items: GraduatedItem[]): void {
  if (typeof window === "undefined") return;
  if (items.length === 0) return;
  window.dispatchEvent(
    new CustomEvent("lingo:vocab-graduated", { detail: items }),
  );
}

/** Test helper — direct flag query so tests can assert idempotency. */
export function _isModuleGraduated(
  courseId: string,
  moduleId: string,
): boolean {
  return isModuleGraduated(loadGraduatedModules(), courseId, moduleId);
}

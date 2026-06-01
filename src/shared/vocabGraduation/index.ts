/**
 * Vocab graduation — generic module-completion → flashcard graduation
 * pipeline.
 *
 * When a module is completed, all anchor words from that module's rows
 * "graduate" — they're snapshotted into the graduation store and a
 * `lingo:vocab-graduated` CustomEvent fires for the flashcards-side
 * receiver (other maintainer) to consume. The receiver isn't wired yet
 * so the dispatch is harmless until they wire it.
 *
 * Idempotency: `graduateModule` checks a per-course flag store and is a
 * no-op if the module has already graduated. The items array is deduped
 * by surface form (kana) so repeated calls never produce duplicates.
 *
 * Language scoping: every public function takes a `languageId`. Storage
 * keys are per-language so KO graduations don't trample JA ones. Anchor
 * resolution is currently JA-only (depends on the hiragana row catalog);
 * non-JA languages return `[]` until their per-language anchor source is
 * wired. Phase 2 will route resolution through the language registry.
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

/** Public read API — current graduated items for a (language, course). */
export function getGraduatedVocab(
  languageId: string,
  courseId: string,
): GraduatedItem[] {
  return getCourseItems(loadStore(languageId), courseId);
}

/**
 * Parse a JA lesson id like `ja-m1-{rowId}-{suffix}` (or legacy
 * `ja-m1-{rowId}`) down to its row id. Row ids may contain hyphens
 * (`da-ba`, `yo-sh-ch`, `yo-m-r`) so we strip the trailing
 * `-(\d+|test|recap)` suffix only. Returns null for ids that don't
 * follow the JA row pattern.
 *
 * Phase 2: route through the language module's lesson-id parser.
 */
function jaRowIdFromLessonId(lessonId: string): string | null {
  const m = /^ja-m\d+-(.+)$/.exec(lessonId);
  if (!m) return null;
  let tail = m[1];
  const sub = /^(.+)-(\d+|test|recap)$/.exec(tail);
  if (sub) tail = sub[1];
  return tail;
}

/**
 * Collect every anchor word reachable from the lessons of `module`.
 * Currently JA-only — walks the JA hiragana row catalog. Other languages
 * return `[]` here until their per-language anchor source is wired in
 * Phase 2.
 */
function collectModuleAnchorWords(
  languageId: string,
  module: CourseModule,
): GraduatedItem[] {
  if (languageId !== "ja") return [];
  const seen = new Set<string>();
  const items: GraduatedItem[] = [];
  const rowsById = new Map(ALL_ROWS.map((r) => [r.id, r]));
  const collectedRowIds = new Set<string>();

  for (const lesson of module.lessons) {
    const rowId = jaRowIdFromLessonId(lesson.id);
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
 * Snapshot `module`'s anchor words into the (language, course)
 * graduation store. Returns the NEW items added (so callers can wire a
 * UI toast / nudge), not the full store contents. Idempotent —
 * re-running for an already-graduated module is a no-op and returns
 * `[]`.
 */
export function graduateModule(
  languageId: string,
  courseId: string,
  module: CourseModule,
): GraduatedItem[] {
  if (module.comingSoon) return [];
  if (module.lessons.length === 0) return [];

  const modules = loadGraduatedModules(languageId);
  if (isModuleGraduated(modules, courseId, module.id)) return [];

  const candidates = collectModuleAnchorWords(languageId, module);
  if (candidates.length === 0) {
    // Even with no anchor words, mark the module graduated so we don't
    // re-scan on every page load.
    saveGraduatedModules(
      languageId,
      markModuleGraduated(modules, courseId, module.id),
    );
    return [];
  }

  const store = loadStore(languageId);
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
    saveStore(languageId, store);
  }
  saveGraduatedModules(
    languageId,
    markModuleGraduated(modules, courseId, module.id),
  );
  notifyFlashcardsOfGraduation(languageId, added);
  // Bump the SRS revision bus so any consumer of graduated vocab
  // re-renders (no receiver wired yet but the channel is open).
  notifySRSStoreChanged();
  return added;
}

/** Dev tool — wipe the (language, course) graduation + module-flag stores. */
export function clearGraduatedVocab(
  languageId: string,
  courseId?: string,
): void {
  clearStorage(languageId, courseId);
  notifySRSStoreChanged();
}

/**
 * Stub for the flashcards maintainer to override. Currently dispatches a
 * `lingo:vocab-graduated` CustomEvent on the window so a future receiver
 * can subscribe whenever it lands. No-op when items is empty.
 *
 * `event.detail` is the items array (backwards-compat with the pre-
 * multilang shape). `languageId` is exposed on the event as
 * `event.languageId` for the eventual multi-language receiver — Phase 2
 * will move this onto `event.detail` once the receiver lands.
 */
export function notifyFlashcardsOfGraduation(
  languageId: string,
  items: GraduatedItem[],
): void {
  if (typeof window === "undefined") return;
  if (items.length === 0) return;
  const event = new CustomEvent("lingo:vocab-graduated", { detail: items });
  // Phase 2: fold this into `detail` once a receiver consumes it.
  (event as unknown as { languageId: string }).languageId = languageId;
  window.dispatchEvent(event);
}

/** Test helper — direct flag query so tests can assert idempotency. */
export function _isModuleGraduated(
  languageId: string,
  courseId: string,
  moduleId: string,
): boolean {
  return isModuleGraduated(
    loadGraduatedModules(languageId),
    courseId,
    moduleId,
  );
}

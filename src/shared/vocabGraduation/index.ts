/**
 * Vocab graduation — generic module-completion → flashcard graduation
 * pipeline.
 *
 * When a module is completed, all anchor words from that module's
 * curriculum-side anchor source "graduate" — they're snapshotted into
 * the graduation store for downstream consumers to read via
 * `getGraduatedVocab`.
 *
 * Idempotency: `graduateModule` checks a per-course flag store and is a
 * no-op if the module has already graduated. The items array is deduped
 * by surface form so repeated calls never produce duplicates.
 *
 * Phase 2 (2026-06-01) — anchor resolution routes through
 * `module.vocabGraduation.collectAnchorsForModule(module)`. JA plugs in
 * its hiragana-row walker via that slot. Languages without the
 * capability get an empty list.
 */

import type { CourseModule } from "@/shared/domain/course";
import { notifySRSStoreChanged } from "@/features/flashcards/SRSStoreRevisionContext";
import { tryGetLanguageModule } from "@/shared/language/registry";
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
 * Collect every anchor word reachable from `module`. Routes through
 * `LanguageModule.vocabGraduation.collectAnchorsForModule` so the
 * language owns its own anchor-discovery logic. Languages without the
 * capability return `[]`.
 */
function collectModuleAnchorWords(
  languageId: string,
  module: CourseModule,
): GraduatedItem[] {
  const lm = tryGetLanguageModule(languageId);
  const collector = lm?.vocabGraduation?.collectAnchorsForModule;
  if (!collector) return [];
  const seen = new Set<string>();
  const items: GraduatedItem[] = [];
  const nowIso = new Date().toISOString();
  for (const anchor of collector(module)) {
    if (seen.has(anchor.surface)) continue;
    seen.add(anchor.surface);
    items.push({
      kana: anchor.surface,
      romaji: anchor.romanization ?? "",
      meaning: anchor.meaning ?? "",
      sourceModuleId: module.id,
      sourceModuleTitle: module.eyebrow ?? module.title,
      unlockedAt: nowIso,
    });
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

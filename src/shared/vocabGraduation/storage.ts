/**
 * LocalStorage backing for the vocab graduation store.
 *
 * Keys (per language):
 *   - `lingo_graduated_vocab_<lang>_v1`     — per-course graduated items
 *   - `lingo_graduated_modules_<lang>_v1`   — per-course completed module flags
 *     (prevents double-graduation across reloads)
 *
 * Legacy un-prefixed keys (`lingo_graduated_vocab_v1` /
 * `lingo_graduated_modules_v1`) are migrated on read into the `ja`
 * namespace, since they pre-date multilang support and only ever held
 * JA data. Migration is a one-shot move-and-delete.
 *
 * The store is intentionally tiny and append-only. The flashcards-side
 * receiver decides whether/when to archive items.
 */

import type { GraduatedItem, VocabGraduationStore } from "./types";

const LEGACY_STORAGE_KEY = "lingo_graduated_vocab_v1";
const LEGACY_MODULES_FLAG_KEY = "lingo_graduated_modules_v1";

function storageKey(languageId: string): string {
  return `lingo_graduated_vocab_${languageId}_v1`;
}

function modulesFlagKey(languageId: string): string {
  return `lingo_graduated_modules_${languageId}_v1`;
}

type GraduatedModuleStore = Record<string, string[]>; // courseId -> moduleIds

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * One-shot migration of the legacy un-prefixed JA keys to the new
 * `ja`-namespaced ones. Runs on first read for `ja`; no-op for other
 * languages. Idempotent — clears legacy keys after migration so it
 * never runs twice.
 */
function migrateLegacyJaKeys(languageId: string): void {
  if (typeof window === "undefined") return;
  if (languageId !== "ja") return;
  const legacyVocab = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  const legacyMods = window.localStorage.getItem(LEGACY_MODULES_FLAG_KEY);
  if (legacyVocab === null && legacyMods === null) return;
  try {
    if (legacyVocab !== null) {
      const newKey = storageKey("ja");
      if (window.localStorage.getItem(newKey) === null) {
        window.localStorage.setItem(newKey, legacyVocab);
      }
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    if (legacyMods !== null) {
      const newKey = modulesFlagKey("ja");
      if (window.localStorage.getItem(newKey) === null) {
        window.localStorage.setItem(newKey, legacyMods);
      }
      window.localStorage.removeItem(LEGACY_MODULES_FLAG_KEY);
    }
  } catch {
    // ignore quota errors
  }
}

export function loadStore(languageId: string): VocabGraduationStore {
  if (typeof window === "undefined") return {};
  migrateLegacyJaKeys(languageId);
  return safeParse<VocabGraduationStore>(
    window.localStorage.getItem(storageKey(languageId)),
    {},
  );
}

export function saveStore(
  languageId: string,
  store: VocabGraduationStore,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(languageId), JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function loadGraduatedModules(
  languageId: string,
): GraduatedModuleStore {
  if (typeof window === "undefined") return {};
  migrateLegacyJaKeys(languageId);
  return safeParse<GraduatedModuleStore>(
    window.localStorage.getItem(modulesFlagKey(languageId)),
    {},
  );
}

export function saveGraduatedModules(
  languageId: string,
  store: GraduatedModuleStore,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      modulesFlagKey(languageId),
      JSON.stringify(store),
    );
  } catch {
    // ignore quota errors
  }
}

export function getCourseItems(
  store: VocabGraduationStore,
  courseId: string,
): GraduatedItem[] {
  return store[courseId] ?? [];
}

export function isModuleGraduated(
  store: GraduatedModuleStore,
  courseId: string,
  moduleId: string,
): boolean {
  return (store[courseId] ?? []).includes(moduleId);
}

export function markModuleGraduated(
  store: GraduatedModuleStore,
  courseId: string,
  moduleId: string,
): GraduatedModuleStore {
  const list = store[courseId] ?? [];
  if (list.includes(moduleId)) return store;
  return { ...store, [courseId]: [...list, moduleId] };
}

export function clearStorage(languageId: string, courseId?: string): void {
  if (typeof window === "undefined") return;
  if (!courseId) {
    window.localStorage.removeItem(storageKey(languageId));
    window.localStorage.removeItem(modulesFlagKey(languageId));
    return;
  }
  const items = loadStore(languageId);
  delete items[courseId];
  saveStore(languageId, items);
  const mods = loadGraduatedModules(languageId);
  delete mods[courseId];
  saveGraduatedModules(languageId, mods);
}

export const STORAGE_KEYS = {
  storageKey,
  modulesFlagKey,
  LEGACY_STORAGE_KEY,
  LEGACY_MODULES_FLAG_KEY,
};

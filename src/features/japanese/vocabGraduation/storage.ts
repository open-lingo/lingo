/**
 * LocalStorage backing for the vocab graduation store.
 *
 * Keys:
 *   - `lingo_graduated_vocab_v1`           — per-course graduated items
 *   - `lingo_graduated_modules_v1`         — per-course completed module flags
 *     (prevents double-graduation across reloads)
 *
 * The store is intentionally tiny and append-only. The flashcards-side
 * receiver decides whether/when to archive items.
 */

import type { GraduatedItem, VocabGraduationStore } from "./types";

const STORAGE_KEY = "lingo_graduated_vocab_v1";
const MODULES_FLAG_KEY = "lingo_graduated_modules_v1";

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

export function loadStore(): VocabGraduationStore {
  if (typeof window === "undefined") return {};
  return safeParse<VocabGraduationStore>(
    window.localStorage.getItem(STORAGE_KEY),
    {},
  );
}

export function saveStore(store: VocabGraduationStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function loadGraduatedModules(): GraduatedModuleStore {
  if (typeof window === "undefined") return {};
  return safeParse<GraduatedModuleStore>(
    window.localStorage.getItem(MODULES_FLAG_KEY),
    {},
  );
}

export function saveGraduatedModules(store: GraduatedModuleStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODULES_FLAG_KEY, JSON.stringify(store));
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

export function clearStorage(courseId?: string): void {
  if (typeof window === "undefined") return;
  if (!courseId) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(MODULES_FLAG_KEY);
    return;
  }
  const items = loadStore();
  delete items[courseId];
  saveStore(items);
  const mods = loadGraduatedModules();
  delete mods[courseId];
  saveGraduatedModules(mods);
}

export const STORAGE_KEYS = {
  STORAGE_KEY,
  MODULES_FLAG_KEY,
};

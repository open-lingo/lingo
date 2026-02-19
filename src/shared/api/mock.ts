/**
 * Mock API: fetch user's preferred language (e.g. from backend).
 * When the real API exists, replace this with a call to the backend.
 */
import type { Language } from "@/shared/domain/languages";
import { LANGUAGES, getLanguageById } from "@/shared/domain/languages";

const CACHE_KEY = "open-lingo-language";

export async function fetchUserPreferredLanguage(): Promise<string> {
  await new Promise((r) => setTimeout(r, 300)); // simulate network
  // Mock: return first language as default when no backend
  return LANGUAGES[0]?.id ?? "ko";
}

export function getCachedLanguageId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CACHE_KEY);
}

export function setCachedLanguageId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, id);
}

/**
 * Resolve selected language: cache first, then mock API.
 */
export async function resolvePreferredLanguage(): Promise<Language> {
  const cached = getCachedLanguageId();
  if (cached) {
    const lang = getLanguageById(cached);
    if (lang) return lang;
  }
  const id = await fetchUserPreferredLanguage();
  const lang = getLanguageById(id);
  if (lang) {
    setCachedLanguageId(id);
    return lang;
  }
  const fallback = LANGUAGES[0];
  if (fallback) setCachedLanguageId(fallback.id);
  return fallback ?? { id: "en", name: "English", flag: "🇺🇸" };
}

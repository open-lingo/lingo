import type { ThemeDefinition, ThemeTokens } from "./types";

const THEMES_STORAGE_KEY = "open-lingo-themes";
const OLD_CUSTOM_KEY = "open-lingo-custom-theme";
const STARRED_STORAGE_KEY = "open-lingo-starred-themes";

export type StoredThemes = {
  customThemes: ThemeDefinition[];
};

export function loadStoredThemes(): StoredThemes {
  if (typeof window === "undefined") {
    return { customThemes: [] };
  }
  try {
    let raw = localStorage.getItem(THEMES_STORAGE_KEY);
    if (!raw) {
      const oldCustom = localStorage.getItem(OLD_CUSTOM_KEY);
      const customThemes: ThemeDefinition[] = [];
      if (oldCustom) {
        try {
          const tokens = JSON.parse(oldCustom) as ThemeTokens;
          if (tokens?.colors && tokens?.radius && tokens?.shadow) {
            customThemes.push({
              id: "custom-1",
              name: "Custom",
              tokens,
            });
          }
        } catch {
          /* ignore */
        }
      }
      const migrated = { customThemes };
      saveStoredThemes(migrated);
      return migrated;
    }
    const parsed = JSON.parse(raw) as { activeThemeId?: string; customThemes?: ThemeDefinition[] };
    let customThemes = Array.isArray(parsed.customThemes) ? parsed.customThemes : [];
    customThemes = customThemes.filter(
      (t) => t?.id && t?.name && t?.tokens?.colors && t?.tokens?.radius && t?.tokens?.shadow
    );
    return { customThemes };
  } catch {
    return { customThemes: [] };
  }
}

export function saveStoredThemes(data: StoredThemes): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(data));
}

export function loadStarredThemeIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STARRED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveStarredThemeIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(ids));
}

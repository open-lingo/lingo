import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import i18n from "i18next";
import { DEFAULT_SETTINGS, type FlashcardsSettings, type UserSettings } from "@/shared/settings/types";
import {
  ensureUserConsistency,
  getStoredSettings,
  migrateToSingleKey,
  setStoredSettings,
} from "@/features/settings/storage";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { setAudioVolume } from "@/shared/audio/volume";

type SettingsContextValue = {
  settings: UserSettings;
  updateSetting: <K extends string>(path: K extends `${infer A}.${infer B}`
    ? A extends keyof UserSettings
      ? B extends keyof UserSettings[A]
        ? K
        : never
      : never
    : K extends keyof UserSettings
      ? K
      : never, value: unknown) => void;
  updateFlashcards: (partial: Partial<FlashcardsSettings>) => void;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function parseStudyOptions(raw: unknown): FlashcardsSettings["studyOptions"] {
  if (!Array.isArray(raw)) return [];
  const out: FlashcardsSettings["studyOptions"] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const name = typeof o.name === "string" ? o.name : "";
    const deckIds = Array.isArray(o.deckIds)
      ? o.deckIds.filter((x): x is string => typeof x === "string")
      : [];
    if (!id || !name) continue;
    out.push({ id, name, deckIds });
  }
  return out;
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = current[key];
    if (next == null || typeof next !== "object" || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Build the cross-device patch sent to `PATCH /me/settings`. The backend
 * stores an opaque blob (`extra: allow`) and deep-merges nested objects, so we
 * send the FULL settings object for every namespace that maps to real runtime
 * behavior — appearance (incl. navLayout), accessibility, audio, notifications,
 * learning, display, flashcards. localStorage stays the instant-apply cache;
 * this keeps the account authoritative so switching device/browser preserves
 * sidebar-vs-topbar, reduced-motion, volume, font size, etc.
 *
 * Legacy flat keys (`theme`, `learningLanguage`, `uiLocale`) are still mirrored
 * so older clients / server consumers that read the flat shape keep working.
 */
export function toBackendPatch(settings: UserSettings): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (settings.appearance != null) {
    patch.appearance = { ...settings.appearance };
    if (settings.appearance.themeId != null) {
      patch.theme = settings.appearance.themeId; // legacy flat mirror
    }
  }
  if (settings.accessibility != null) {
    patch.accessibility = { ...settings.accessibility };
  }
  if (settings.audio != null) {
    patch.audio = { ...settings.audio };
  }
  if (settings.notifications != null) {
    patch.notifications = { ...settings.notifications };
  }
  if (settings.display != null && Object.keys(settings.display).length > 0) {
    patch.display = { ...settings.display };
  }
  if (settings.flashcards != null) {
    patch.flashcards = settings.flashcards;
  }

  if (settings.learning != null) {
    patch.learning = { ...settings.learning };
    if (settings.learning.learningLanguageId != null) {
      patch.learningLanguage = settings.learning.learningLanguageId; // legacy flat mirror
    }
    if (settings.learning.uiLocale != null) {
      patch.uiLocale = settings.learning.uiLocale; // legacy flat mirror
    }
  }

  return patch;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Hydrate UserSettings from the backend blob. Every namespace round-trips:
 * nested objects win, but legacy flat keys (`theme`, `learningLanguage`,
 * `uiLocale`) are honored as a fallback so accounts written by older clients
 * still load. Each namespace is layered over its DEFAULT so a partial blob
 * never drops sibling fields.
 */
export function fromBackendResponse(backend: Record<string, unknown>): Partial<UserSettings> {
  const partial: Partial<UserSettings> = {};

  // appearance — nested wins; flat `theme` is the fallback.
  const appearance: Record<string, unknown> = { ...DEFAULT_SETTINGS.appearance };
  if (typeof backend.theme === "string") appearance.themeId = backend.theme;
  if (isObj(backend.appearance)) Object.assign(appearance, backend.appearance);
  if (typeof appearance.themeId !== "string" || !appearance.themeId) {
    appearance.themeId = DEFAULT_SETTINGS.appearance.themeId;
  }
  partial.appearance = appearance as UserSettings["appearance"];

  // accessibility
  if (isObj(backend.accessibility)) {
    partial.accessibility = {
      ...DEFAULT_SETTINGS.accessibility,
      ...backend.accessibility,
    } as UserSettings["accessibility"];
  }

  // audio
  if (isObj(backend.audio)) {
    partial.audio = {
      ...DEFAULT_SETTINGS.audio,
      ...backend.audio,
    } as UserSettings["audio"];
  }

  // notifications
  if (isObj(backend.notifications)) {
    partial.notifications = {
      ...DEFAULT_SETTINGS.notifications,
      ...backend.notifications,
    } as UserSettings["notifications"];
  }

  // display
  if (isObj(backend.display)) {
    partial.display = { ...backend.display } as UserSettings["display"];
  }

  // flashcards
  if (isObj(backend.flashcards)) {
    partial.flashcards = {
      studyOptions: parseStudyOptions(backend.flashcards.studyOptions),
    };
  }

  // learning — nested wins; flat `learningLanguage` / `uiLocale` are fallbacks.
  const learning: Record<string, unknown> = { ...DEFAULT_SETTINGS.learning };
  if (typeof backend.learningLanguage === "string") {
    learning.learningLanguageId = backend.learningLanguage;
  }
  if (typeof backend.uiLocale === "string") learning.uiLocale = backend.uiLocale;
  if (isObj(backend.learning)) Object.assign(learning, backend.learning);
  // A saved learning language (nested or legacy flat) implies onboarding done,
  // so clearing site data never replays the first-launch language modal.
  if (learning.learningLanguageId && learning.onboardingCompleted !== true) {
    learning.onboardingCompleted = true;
  }
  partial.learning = learning as UserSettings["learning"];

  return partial;
}

function mergeWithDefaults(partial: Partial<UserSettings>): UserSettings {
  const merged = { ...DEFAULT_SETTINGS };
  if (partial.appearance) merged.appearance = { ...merged.appearance, ...partial.appearance };
  if (partial.accessibility)
    merged.accessibility = { ...merged.accessibility, ...partial.accessibility };
  if (partial.audio) merged.audio = { ...merged.audio, ...partial.audio };
  if (partial.notifications)
    merged.notifications = { ...merged.notifications, ...partial.notifications };
  if (partial.learning) merged.learning = { ...merged.learning, ...partial.learning };
  if (partial.display) merged.display = { ...merged.display, ...partial.display };
  if (partial.flashcards) {
    merged.flashcards = {
      studyOptions:
        partial.flashcards.studyOptions ?? merged.flashcards?.studyOptions ?? DEFAULT_SETTINGS.flashcards!.studyOptions,
    };
  }
  return merged;
}

function migrateFromLegacy(): Partial<UserSettings> {
  if (typeof window === "undefined") return {};
  const partial: Partial<UserSettings> = {};
  try {
    const themesRaw = localStorage.getItem("open-lingo-themes");
    if (themesRaw) {
      const parsed = JSON.parse(themesRaw) as { activeThemeId?: string };
      if (typeof parsed?.activeThemeId === "string") {
        partial.appearance = {
          ...DEFAULT_SETTINGS.appearance,
          themeId: parsed.activeThemeId,
        };
      }
    }
    const oldTheme = localStorage.getItem("open-lingo-theme");
    if (oldTheme && !partial.appearance?.themeId) {
      const valid = ["light", "dark", "sepia", "amoled"].includes(oldTheme);
      if (valid) {
        partial.appearance = {
          ...DEFAULT_SETTINGS.appearance,
          themeId: oldTheme,
        };
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const lang = localStorage.getItem("open-lingo-language");
    if (lang) {
      partial.learning = {
        ...(partial.learning ?? DEFAULT_SETTINGS.learning),
        learningLanguageId: lang,
      };
    }
  } catch {
    /* ignore */
  }
  try {
    const uiLng = localStorage.getItem("i18nextLng");
    if (uiLng) {
      const code = uiLng.split("-")[0] ?? uiLng;
      partial.learning = {
        ...(partial.learning ?? DEFAULT_SETTINGS.learning),
        uiLocale: code,
      };
    }
  } catch {
    /* ignore */
  }
  return partial;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { users } = useApi();
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.sub ?? null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      ensureUserConsistency(userId);
      migrateToSingleKey(userId);
      let stored = getStoredSettings();
      const legacy = migrateFromLegacy();
      if (legacy.appearance || legacy.learning) {
        stored = { ...legacy, ...stored };
        setStoredSettings(stored);
      }
      if (typeof window !== "undefined" && stored?.accessibility?.reducedMotion === undefined) {
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        stored = { ...stored, accessibility: { ...DEFAULT_SETTINGS.accessibility, ...stored?.accessibility, reducedMotion: prefersReduced } };
      }
      const merged = mergeWithDefaults(stored ?? {});
      if (!cancelled) {
        setSettingsState(merged);
      }

      if (isAuthenticated && userId) {
        try {
          const backend = await users.getSettings();
          const fromApi = fromBackendResponse(backend as Record<string, unknown>);
          // Server wins over local for signed-in users so clearing site data
          // does not replay onboarding or drop the saved learning language.
          const combined = mergeWithDefaults({ ...stored, ...fromApi });
          if (!cancelled) {
            setSettingsState(combined);
            setStoredSettings(combined);
          }
          if (
            combined.learning.learningLanguageId &&
            !combined.learning.onboardingCompleted
          ) {
            users
              .updateSettings({
                learning: {
                  learningLanguageId: combined.learning.learningLanguageId,
                  onboardingCompleted: true,
                },
                learningLanguage: combined.learning.learningLanguageId,
              })
              .catch(() => {});
          }
        } catch {
          if (!cancelled) {
            setSettingsState(mergeWithDefaults(stored ?? {}));
          }
        }
      }
      if (!cancelled) setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId, users, authLoading]);

  const updateSetting = useCallback(
    (path: string, value: unknown) => {
      setSettingsState((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as UserSettings;
        setByPath(next as unknown as Record<string, unknown>, path, value);
        const nextStored = { ...next, _version: DEFAULT_SETTINGS._version };
        setStoredSettings(nextStored);
        const patch = toBackendPatch(next);
        if (Object.keys(patch).length > 0) {
          users.updateSettings(patch).catch(() => {});
        }
        return next;
      });
    },
    [users]
  );

  const updateFlashcards = useCallback(
    (partial: Partial<FlashcardsSettings>) => {
      setSettingsState((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as UserSettings;
        const fcPatch = Object.fromEntries(
          Object.entries(partial).filter(([, v]) => v !== undefined)
        ) as Partial<FlashcardsSettings>;
        const prevFc = next.flashcards;
        const merged: FlashcardsSettings = {
          studyOptions:
            fcPatch.studyOptions ??
            prevFc?.studyOptions ??
            DEFAULT_SETTINGS.flashcards!.studyOptions,
        };
        next.flashcards = merged;
        const nextStored = { ...next, _version: DEFAULT_SETTINGS._version };
        setStoredSettings(nextStored);
        const patch = toBackendPatch(next);
        if (Object.keys(patch).length > 0) {
          users.updateSettings(patch).catch(() => {});
        }
        return next;
      });
    },
    [users]
  );

  useEffect(() => {
    const lng = settings.learning.uiLocale;
    if (lng && i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  }, [settings.learning.uiLocale]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.accessibility.reducedMotion) {
      root.dataset.reducedMotion = "true";
    } else {
      delete root.dataset.reducedMotion;
    }
  }, [settings.accessibility.reducedMotion]);

  useEffect(() => {
    setAudioVolume(settings.audio.volume ?? 1);
  }, [settings.audio.volume]);

  const value = useMemo(
    () => ({
      settings,
      updateSetting: updateSetting as SettingsContextValue["updateSetting"],
      updateFlashcards,
      isLoading,
    }),
    [settings, updateSetting, updateFlashcards, isLoading]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

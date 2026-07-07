import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { Language } from "@/shared/domain/languages";
import { AVAILABLE_LEARNING_LANGUAGES, getLanguageConfig } from "@/shared/domain/languageConfig";
import { useSettings } from "@/shared/contexts/SettingsContext";

// Mirrors the constant in `features/landing/GetStartedPage.tsx`. Inlined
// here (not imported) to avoid a feature → context import cycle.
const PENDING_LANGUAGE_STORAGE_KEY = "lingo_pending_language_id";
// Mirrors PREVIEW_COMPLETED_STORAGE_KEY in features/preview/PreviewLessonPage.
// Inlined to avoid a feature → context import cycle.
const PREVIEW_COMPLETED_STORAGE_KEY = "lingo_preview_completed_lang";

type LanguageContextValue = {
  language: Language | null;
  languages: Language[];
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSetting, isLoading } = useSettings();
  const learningId = settings.learning.learningLanguageId;
  // null when the user hasn't picked yet — surfaces the LanguagePickerModal
  // on first launch. Pre-Task-#88 there was a silent fallback to the first
  // available language which made the picker dead code.
  const language = learningId ? getLanguageConfig(learningId) ?? null : null;

  const setLanguage = useCallback(
    (lang: Language) => {
      updateSetting("learning.learningLanguageId", lang.id);
      updateSetting("learning.onboardingCompleted", true);
    },
    [updateSetting]
  );

  // Auth0 round-trip seeder. If the user picked a language on
  // /get-started before the Auth0 redirect, that choice is stashed in
  // sessionStorage. Read + clear it on the first post-callback mount.
  useEffect(() => {
    if (isLoading) return;
    if (language) return; // user already has a language set
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(PENDING_LANGUAGE_STORAGE_KEY);
    } catch {
      return;
    }
    if (!pending) return;
    const cfg = getLanguageConfig(pending);
    if (!cfg) {
      // Unknown language id (config dropped, typo) — clear so we don't
      // loop. LanguagePickerModal will then fire.
      sessionStorage.removeItem(PENDING_LANGUAGE_STORAGE_KEY);
      return;
    }
    updateSetting("learning.learningLanguageId", cfg.id);
    sessionStorage.removeItem(PENDING_LANGUAGE_STORAGE_KEY);
  }, [isLoading, language, updateSetting]);

  // Carry a completed `/try` preview across the Auth0 round-trip. Persisted
  // durably so the post-signup arc/home can acknowledge it (the preview is no
  // longer thrown away). Runs once the flag is present, regardless of whether
  // the language was already set.
  const previewCompleted = settings.learning.previewCompletedLanguageId;
  useEffect(() => {
    if (isLoading) return;
    let pendingPreview: string | null = null;
    try {
      pendingPreview = sessionStorage.getItem(PREVIEW_COMPLETED_STORAGE_KEY);
    } catch {
      return;
    }
    if (!pendingPreview) return;
    if (previewCompleted !== pendingPreview) {
      updateSetting("learning.previewCompletedLanguageId", pendingPreview);
    }
    try {
      sessionStorage.removeItem(PREVIEW_COMPLETED_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [isLoading, previewCompleted, updateSetting]);

  const value = useMemo(
    () => ({
      language,
      languages: AVAILABLE_LEARNING_LANGUAGES,
      setLanguage,
      isLoading,
    }),
    [language, setLanguage, isLoading]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

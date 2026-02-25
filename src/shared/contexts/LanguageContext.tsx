import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { Language } from "@/shared/domain/languages";
import { AVAILABLE_LEARNING_LANGUAGES, getLanguageConfig } from "@/shared/domain/languageConfig";
import { useSettings } from "@/shared/contexts/SettingsContext";

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
  const language = getLanguageConfig(learningId) ?? AVAILABLE_LEARNING_LANGUAGES[0] ?? null;

  const setLanguage = useCallback(
    (lang: Language) => {
      updateSetting("learning.learningLanguageId", lang.id);
    },
    [updateSetting]
  );

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

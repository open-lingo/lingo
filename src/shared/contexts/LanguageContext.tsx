import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Language } from "@/shared/domain/languages";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import { setCachedLanguageId, resolvePreferredLanguage } from "@/shared/api/mock";
import { useApi } from "@/shared/api/provider";

type LanguageContextValue = {
  language: Language | null;
  languages: Language[];
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { users } = useApi();

  useEffect(() => {
    let cancelled = false;
    resolvePreferredLanguage().then((lang) => {
      if (!cancelled) {
        setLanguageState(lang);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setCachedLanguageId(lang.id);
    users.updateSettings({ learningLanguage: lang.id }).catch(() => {});
  }, [users]);

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

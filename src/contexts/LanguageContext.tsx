import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Language } from "@/core/languages";
import { LANGUAGES } from "@/core/languages";
import { setCachedLanguageId, resolvePreferredLanguage } from "@/api/mock";

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
  }, []);

  const value = useMemo(
    () => ({
      language,
      languages: LANGUAGES,
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

import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

export function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { language, setLanguage } = useLanguage();

  const isValid =
    lang &&
    AVAILABLE_LEARNING_LANGUAGE_IDS.includes(lang as (typeof AVAILABLE_LEARNING_LANGUAGE_IDS)[number]);
  const fallback = AVAILABLE_LEARNING_LANGUAGE_IDS[0];

  useEffect(() => {
    if (!isValid || !lang) return;
    const config = getLanguageConfig(lang);
    if (config && language?.id !== lang) {
      setLanguage(config);
    }
  }, [lang, isValid, language?.id, setLanguage]);

  if (!lang) {
    return <Navigate to={`/${fallback}`} replace />;
  }

  if (!isValid) {
    return <Navigate to={`/${fallback}`} replace />;
  }

  return <Outlet />;
}

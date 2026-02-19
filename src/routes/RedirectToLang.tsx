import { Navigate } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

export function RedirectToLang() {
  const { language, isLoading } = useLanguage();
  const lang = language?.id ?? AVAILABLE_LEARNING_LANGUAGE_IDS[0];
  if (isLoading) return null;
  return <Navigate to={`/${lang}`} replace />;
}

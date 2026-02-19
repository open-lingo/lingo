import { useParams } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

/** Current lang from URL params or context. Falls back to first available. */
export function useLang(): string {
  const { lang } = useParams<{ lang: string }>();
  const { language } = useLanguage();
  const resolved = lang ?? language?.id ?? AVAILABLE_LEARNING_LANGUAGE_IDS[0];
  return AVAILABLE_LEARNING_LANGUAGE_IDS.includes(resolved as (typeof AVAILABLE_LEARNING_LANGUAGE_IDS)[number])
    ? resolved
    : AVAILABLE_LEARNING_LANGUAGE_IDS[0];
}

/** Build a path with the current language prefix. Path can have leading slash or not. */
export function useLangPath(): (path: string) => string {
  const lang = useLang();
  return (path: string) => {
    const p = path.startsWith("/") ? path.slice(1) : path;
    return p ? `/${lang}/${p}` : `/${lang}`;
  };
}

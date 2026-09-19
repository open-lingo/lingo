import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import { useVisibleLearningLanguageIds } from "@/shared/hooks/useVisibleLearningLanguageIds";
import { CommunityContentProvider } from "@/features/community/CommunityContentContext";
import { DictionaryModalProvider } from "@/features/dictionary/DictionaryModalContext";

/**
 * `:lang` route guard for every `/:lang/*` route (course map, lesson
 * player, placement, dev QA pages included). `isValid` reads the
 * signed-in user's VISIBLE language set (base list + `pt` when beta-
 * allow-listed — see useVisibleLearningLanguageIds's header), NOT the
 * static base list, so this is the gate that makes `/pt/...` reachable
 * at all for an allow-listed user and unreachable (redirected to
 * `fallback`) for everyone else — including a signed-in Spencer when the
 * flag itself is off.
 */
export function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { language, setLanguage } = useLanguage();
  const visibleIds = useVisibleLearningLanguageIds();

  const isValid = !!lang && visibleIds.includes(lang);
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

  return (
    <CommunityContentProvider>
      <DictionaryModalProvider>
        <Outlet />
      </DictionaryModalProvider>
    </CommunityContentProvider>
  );
}

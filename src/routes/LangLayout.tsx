import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import { useVisibleLearningLanguageIds } from "@/shared/hooks/useVisibleLearningLanguageIds";
import { useFeatureFlagsReadyOptional } from "@/shared/contexts/FeatureFlagsContext";
import { CommunityContentProvider } from "@/features/community/CommunityContentContext";
import { DictionaryModalProvider } from "@/features/dictionary/DictionaryModalContext";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";

/**
 * `:lang` route guard for every `/:lang/*` route (course map, lesson
 * player, placement, dev QA pages included). `isValid` reads the
 * signed-in user's VISIBLE language set (base list + `pt` when beta-
 * allow-listed — see useVisibleLearningLanguageIds's header), NOT the
 * static base list, so this is the gate that makes `/pt/...` reachable
 * at all for an allow-listed user and unreachable (redirected to
 * `fallback`) for everyone else — including a signed-in Spencer when the
 * flag itself is off.
 *
 * Cold-load race (lane PTFIX, 2026-09-18): `FeatureFlagsProvider` (mounted
 * in `main.tsx`, above the router) starts at `DEFAULT_FEATURE_FLAGS`
 * (`ptBeta.enabled: false`) and resolves the real flags asynchronously.
 * A direct navigation or refresh on `/pt/*` renders THIS layout before
 * that fetch resolves, so `isValid` reads false on the first render even
 * for an allow-listed user — redirecting away before the identity has had
 * a chance to prove itself. While flags are still pending AND the course
 * currently reads as not-visible, render the loading state instead of
 * redirecting; only redirect once flags have resolved. A language that's
 * ALWAYS visible (the base ja/ko/es/fr list, independent of flags) is
 * unaffected — `isValid` is already true on the first render regardless
 * of `flagsReady`, so there is no added loading flash for the existing
 * courses.
 */
export function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { language, setLanguage } = useLanguage();
  const visibleIds = useVisibleLearningLanguageIds();
  const flagsReady = useFeatureFlagsReadyOptional();

  const isValid = !!lang && visibleIds.includes(lang);
  const pending = !isValid && !flagsReady;
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

  if (pending) {
    return <CenteredLoader py="xl" />;
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

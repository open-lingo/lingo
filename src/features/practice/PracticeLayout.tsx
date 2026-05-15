import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";
import {
  getPracticeItemsForLanguage,
  type PracticeNavItem,
} from "./practiceNavItems";

/** Grace period before redirecting an apparently-anon user out of /practice.
 *  Auth0 can briefly report `isLoading: false && isAuthenticated: false` while
 *  silent auth completes via iframe; redirecting immediately races that and
 *  bounces real users back to /learn. 1.5s is invisible to humans and
 *  comfortably longer than the worst-case silent-auth round trip we've seen. */
const ANON_REDIRECT_GRACE_MS = 1500;

function PracticeTab({ item, isActive, t }: { item: PracticeNavItem; isActive: boolean; t: (k: string) => string }) {
  const label = item.labelKey ? t(item.labelKey) : (item.label ?? "");
  const char = item.sampleCharacter;
  const iconName = item.iconName;

  return (
    <TabLink to={item.to} isActive={isActive} className="flex items-center gap-2 px-3">
      {iconName && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
          <Icon name={iconName} size={16} />
        </span>
      )}
      {!iconName && char && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xs" aria-hidden>
          {char}
        </span>
      )}
      {label}
    </TabLink>
  );
}

export function PracticeLayout() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const location = useLocation();
  const pathname = location.pathname;
  const langPath = useLangPath();
  const flashcardsPath = langPath("practice/flashcards");
  const isFlashcardsSubRoute = pathname.startsWith(flashcardsPath + "/");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Anon users hitting a /practice/* deep link land on the guided Learn hub
  // instead — Practice is per-account (progress/SRS) and the Learn page funnels
  // first-time users into the right starting point. The redirect is debounced
  // so Auth0's iframe-based silent-auth round trip can complete first.
  useEffect(() => {
    if (authLoading) {
      setShouldRedirect(false);
      return;
    }
    if (isAuthenticated) {
      setShouldRedirect(false);
      return;
    }
    const timer = window.setTimeout(
      () => setShouldRedirect(true),
      ANON_REDIRECT_GRACE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [authLoading, isAuthenticated]);

  if (shouldRedirect) {
    return <Navigate to={langPath("learn")} replace />;
  }

  const items = getPracticeItemsForLanguage(language?.id).filter(
    (item) => !(isFlashcardsSubRoute && item.to === flashcardsPath)
  );

  function isActive(item: PracticeNavItem): boolean {
    if (pathname === item.to) return true;
    if (item.to.endsWith("/practice/flashcards") && (pathname === item.to || pathname.startsWith(item.to + "/"))) return true;
    if (item.to.endsWith("/practice/stories") && (pathname === item.to || pathname.startsWith(item.to + "/"))) return true;
    if (item.to.endsWith("/practice/videos") && (pathname === item.to || pathname.startsWith(item.to + "/"))) return true;
    if (item.to.endsWith("/practice/external-content") && pathname.includes("/practice/external-content")) return true;
    if (item.to.includes("/practice/alphabet/") && (pathname === item.to || pathname.startsWith(item.to + "/"))) return true;
    if (item.to.endsWith("/practice/alphabet") && pathname.startsWith(item.to)) return true;
    return false;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("nav.practice")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t("practice.intro")}
        </p>
      </div>

      <TabList
        aria-label={t("practice.tabsLabel")}
        className="flex flex-wrap gap-1"
      >
        {items.map((item) => (
          <PracticeTab
            key={item.to + (item.label ?? "")}
            item={item}
            isActive={isActive(item)}
            t={t}
          />
        ))}
      </TabList>

      <Outlet />
    </div>
  );
}

import { Outlet, useLocation } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";
import {
  getPracticeItemsForLanguage,
  type PracticeNavItem,
} from "./practiceNavItems";

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

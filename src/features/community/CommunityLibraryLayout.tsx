import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { cn } from "@/shared/components/ui/cn";

export type LibraryTabId = "subscribed" | "mine";

export type CommunityLibraryLayoutProps = {
  activeTab: LibraryTabId;
  onTabChange: (tab: LibraryTabId) => void;
  children: ReactNode;
};

/**
 * CommunityLibraryLayout — the personal area of community. Distinct from the
 * discovery surface: this is the viewer's own subscriptions and authored decks,
 * not contributor/discovery content. Tabs are URL-driven by the host page.
 */
export function CommunityLibraryLayout({
  activeTab,
  onTabChange,
  children,
}: CommunityLibraryLayoutProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  const tabs: { id: LibraryTabId; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
    { id: "subscribed", label: t("community.libraryTabSubscribed", "Subscribed"), icon: "bookmark" },
    { id: "mine", label: t("community.libraryTabMine", "My decks"), icon: "layers" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <Link
            to={langPath("community/explore")}
            className="inline-flex items-center gap-1 text-xs font-medium text-text-muted transition hover:text-accent"
          >
            <Icon name="chevronLeft" size={14} aria-hidden />
            {t("community.libraryBackToDiscover", "Back to discover")}
          </Link>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-text-primary">
            <Icon name="library" size={20} aria-hidden />
            {t("community.libraryTitle", "My library")}
          </h2>
        </div>
        <Link
          to={langPath("community/decks/new")}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover"
        >
          <Icon name="plus" size={16} aria-hidden />
          {t("community.contentBrowserNewDeck")}
        </Link>
      </div>

      <div
        role="tablist"
        aria-label={t("community.libraryTabsLabel", "Library views")}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative -mb-px inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition",
              activeTab === tab.id
                ? "border-b-2 border-accent text-accent"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            <Icon name={tab.icon} size={15} aria-hidden />
            {tab.label}
          </button>
        ))}
      </div>

      {children}
    </div>
  );
}

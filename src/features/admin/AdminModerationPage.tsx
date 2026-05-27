/**
 * AdminModerationPage — content + user moderation surfaces at /admin/moderation.
 *
 * Tabs: pending decks, pending stories, reported content (placeholder),
 * banned users, manual user ban. Filled in by task 3.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TabButton, TabList } from "@/shared/components/ui/Tabs";

import { AdminDecksPage } from "./AdminDecksPage";
import { AdminStoriesPage } from "./AdminStoriesPage";

type TabId =
  | "pending-decks"
  | "pending-stories"
  | "reports"
  | "banned"
  | "ban-user";

export function AdminModerationPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>("pending-decks");

  const tabs: { id: TabId; label: string }[] = useMemo(
    () => [
      { id: "pending-decks", label: t("admin.moderation.pendingDecks", "Pending decks") },
      { id: "pending-stories", label: t("admin.moderation.pendingStories", "Pending stories") },
      { id: "reports", label: t("admin.moderation.reports", "Reported content") },
      { id: "banned", label: t("admin.moderation.banned", "Banned users") },
      { id: "ban-user", label: t("admin.moderation.banUser", "Ban a user") },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <TabList>
        {tabs.map((x) => (
          <TabButton key={x.id} isActive={tab === x.id} onClick={() => setTab(x.id)}>
            {x.label}
          </TabButton>
        ))}
      </TabList>

      <div>
        {tab === "pending-decks" && <AdminDecksPage />}
        {tab === "pending-stories" && <AdminStoriesPage />}
        {tab === "reports" && <ReportsPlaceholder />}
        {tab === "banned" && <BannedPlaceholder />}
        {tab === "ban-user" && <BanUserPlaceholder />}
      </div>
    </div>
  );
}

function ReportsPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
      <p className="text-sm font-medium text-text-primary">
        {t("admin.moderation.reportsTitle", "No reports yet")}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {t(
          "admin.moderation.reportsDesc",
          "When users flag content it'll appear here.",
        )}
      </p>
    </div>
  );
}

function BannedPlaceholder() {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-text-muted">{t("common.loading")}</p>
  );
}

function BanUserPlaceholder() {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-text-muted">{t("common.loading")}</p>
  );
}

export default AdminModerationPage;

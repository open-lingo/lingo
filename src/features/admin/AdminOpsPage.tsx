/**
 * AdminOpsPage — consolidated operational tools at /admin/ops.
 *
 * Five tabs: Costs, Subscriptions, Ads, Jobs, Settings.
 *
 * Cost/Subs/Ads/Jobs tab bodies are imported from AdminOperationsPage
 * (the original four-tab page) so we don't duplicate the data-fetching
 * logic. Settings is a placeholder — future home of platform-level
 * runtime config (CORS origins, feature flags, etc.).
 *
 * Platform-wide XP rate tuning lives on /admin/lms (the "Learning config"
 * page) since XP rates are part of the learning system, not finance/ops.
 * Ops is finance / jobs / audit only.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TabButton, TabList } from "@/shared/components/ui/Tabs";

import {
  AdsTab,
  CostRevenueTab,
  JobsTab,
  SubscriptionsTab,
} from "./AdminOperationsPage";

type TabId = "costs" | "subscriptions" | "ads" | "jobs" | "settings";

export function AdminOpsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>("costs");

  const tabs: { id: TabId; label: string }[] = useMemo(
    () => [
      { id: "costs", label: t("admin.ops.tabs.costs", "Costs") },
      { id: "subscriptions", label: t("admin.ops.tabs.subscriptions", "Subscriptions") },
      { id: "ads", label: t("admin.ops.tabs.ads", "Ads") },
      { id: "jobs", label: t("admin.ops.tabs.jobs", "Jobs") },
      { id: "settings", label: t("admin.ops.tabs.settings", "Settings") },
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
        {tab === "costs" && <CostRevenueTab />}
        {tab === "subscriptions" && <SubscriptionsTab />}
        {tab === "ads" && <AdsTab />}
        {tab === "jobs" && <JobsTab />}
        {tab === "settings" && <SettingsPlaceholder />}
      </div>
    </div>
  );
}

function SettingsPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
      <p className="text-sm font-medium text-text-primary">
        {t("admin.ops.settingsTitle", "Settings — coming soon")}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {t(
          "admin.ops.settingsDesc",
          "Future home of platform-level runtime config (CORS origins, feature flags, etc).",
        )}
      </p>
    </div>
  );
}

export default AdminOpsPage;

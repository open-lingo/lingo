/**
 * AdminOpsPage — operational tools at /admin/ops.
 *
 * Tabs: costs, subscriptions, ads, jobs, XP config, settings (placeholder).
 *
 * Tab content lives in the existing AdminOperationsPage (which keeps the
 * four ops tabs) and the existing AdminXpConfigPage. Both are inlined as
 * tab content so /admin/ops is the single ops surface.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TabButton, TabList } from "@/shared/components/ui/Tabs";

import { AdminOperationsPage } from "./AdminOperationsPage";
import { AdminXpConfigPage } from "./AdminXpConfigPage";

type TabId = "ops" | "xp" | "settings";

export function AdminOpsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>("ops");

  const tabs: { id: TabId; label: string }[] = useMemo(
    () => [
      { id: "ops", label: t("admin.ops.tabs.opsBundle", "Costs · Subs · Ads · Jobs") },
      { id: "xp", label: t("admin.ops.tabs.xp", "XP config") },
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
        {tab === "ops" && <AdminOperationsPage />}
        {tab === "xp" && <AdminXpConfigPage />}
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

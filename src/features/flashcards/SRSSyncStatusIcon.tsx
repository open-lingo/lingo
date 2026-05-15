import { useLocation } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { formatTimeAgo } from "@/shared/utils/formatDate";
import { useSRSSyncStatus } from "./useSRSSyncStatus";

/**
 * Persistent SRS sync status icon. Shows in header when on SRS pages (flashcards).
 * Displays: not synced / synced, last sync time. Tooltip on hover.
 */
export function SRSSyncStatusIcon() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const langPath = useLangPath();

  const flashcardsPath = langPath("practice/flashcards");
  const isSrsPage =
    location.pathname === flashcardsPath ||
    location.pathname.startsWith(flashcardsPath + "/");

  const { dirtyCount, lastSyncAt } = useSRSSyncStatus();

  if (!isAuthenticated || !isSrsPage) return null;

  const synced = dirtyCount === 0;
  const tooltip = synced
    ? lastSyncAt
      ? t("flashcards.syncStatusSynced", {
          time: formatTimeAgo(lastSyncAt),
          defaultValue: "Synced · {{time}}",
        })
      : t("flashcards.syncStatusSyncedNever", {
          defaultValue: "Synced",
        })
    : t("flashcards.syncStatusUnsynced", {
        count: dirtyCount,
        defaultValue: "{{count}} card(s) not synced",
      });

  return (
    <div
      className="group relative flex items-center"
      title={tooltip}
      role="status"
      aria-label={tooltip}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center transition ${
          synced
            ? "text-success"
            : "text-warning"
        }`}
      >
        <Icon name="cloud" size={20} strokeWidth={1.5} />
      </div>
      <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden whitespace-nowrap rounded-lg bg-surface-elevated px-2 py-1.5 text-xs font-medium text-text-primary shadow-popover group-hover:block">
        {tooltip}
      </div>
    </div>
  );
}

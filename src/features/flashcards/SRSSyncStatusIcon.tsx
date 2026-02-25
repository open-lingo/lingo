import { useLocation } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useSRSSyncStatus } from "./useSRSSyncStatus";

function formatTimeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

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

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SyncSource } from "./types";

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
      />
    </svg>
  );
}

function formatTimeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function formatTimeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h`;
}

export type SyncManagerProps = {
  /** Sync sources to display. Filtered to visible ones. */
  sources: SyncSource[];
  /** Called when the popover opens (e.g. to refresh sources). */
  onOpen?: () => void;
};

/**
 * Extensible sync manager. Shows a cloud icon that opens a pop-down panel on hover (desktop)
 * or click (mobile). Displays time until sync, last sync time, manual sync button, and
 * supports multiple sync sources (SRS, lessons, story progress, etc.).
 */
const HOVER_LEAVE_DELAY_MS = 150;

export function SyncManager({ sources, onOpen }: SyncManagerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const visibleSources = sources.filter((s) => s.visible);
  const hasDirty = visibleSources.some((s) => s.dirtyCount > 0);

  const scheduleClose = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = null;
      setOpen(false);
    }, HOVER_LEAVE_DELAY_MS);
  };

  const cancelClose = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleSyncNow = async (source: SyncSource) => {
    if (source.syncing || syncingIds.has(source.id)) return;
    setSyncingIds((prev) => new Set(prev).add(source.id));
    try {
      await source.onSyncNow();
      onOpen?.();
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
    }
  };

  if (visibleSources.length === 0) return null;

  return (
    <div
      ref={ref}
      className="group relative flex items-center"
      role="status"
      aria-label={t("syncManager.ariaLabel", { defaultValue: "Sync status" })}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          hasDirty ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
        } hover:bg-gray-100 dark:hover:bg-gray-700`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <CloudIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 -mt-1 min-w-[280px] rounded-lg border border-gray-200 bg-white py-3 pt-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          role="menu"
        >
          <div className="border-b border-gray-100 px-4 pb-2 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("syncManager.title", { defaultValue: "Sync Manager" })}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t("syncManager.subtitle", {
                defaultValue: "Background sync for your progress",
              })}
            </p>
          </div>

          <div className="max-h-[320px] overflow-y-auto px-2 py-2">
            {visibleSources.map((source) => {
              const isSyncing = source.syncing ?? syncingIds.has(source.id);
              const synced = source.dirtyCount === 0;

              return (
                <div
                  key={source.id}
                  className="rounded-lg px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {source.label}
                    </span>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        synced
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {synced
                        ? t("syncManager.synced", { defaultValue: "Synced" })
                        : t("syncManager.unsynced", {
                            count: source.dirtyCount,
                            defaultValue: "{{count}} unsynced",
                          })}
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {source.lastSyncAt && (
                      <p>
                        {t("syncManager.lastSync", {
                          time: formatTimeAgo(source.lastSyncAt),
                          defaultValue: "Last sync: {{time}}",
                        })}
                      </p>
                    )}
                    {source.nextSyncAt && (
                      <p>
                        {t("syncManager.timeUntilSync", {
                          time: formatTimeUntil(source.nextSyncAt),
                          defaultValue: "Next sync in {{time}}",
                        })}
                      </p>
                    )}
                    {!source.lastSyncAt && (
                      <p>
                        {t("syncManager.neverSynced", {
                          defaultValue: "Not yet synced",
                        })}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSyncNow(source)}
                    disabled={isSyncing}
                    className="mt-2 w-full rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    {isSyncing
                      ? t("syncManager.syncing", { defaultValue: "Syncing…" })
                      : t("syncManager.syncNow", { defaultValue: "Sync now" })}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Placeholder for future sources */}
          <div className="border-t border-gray-100 px-4 pt-2 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("syncManager.moreComing", {
                defaultValue: "Lessons & story progress coming soon",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

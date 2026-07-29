import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { formatTimeAgo } from "@/shared/utils/formatDate";
import { cn } from "@/shared/components/ui/cn";
import { Spinner } from "@/shared/components/ui/Spinner";
import type { SyncSource } from "./types";

function formatTimeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h`;
}

function latestLastSyncAt(sources: SyncSource[]): string | null {
  return sources.reduce<string | null>((latest, s) => {
    if (!s.lastSyncAt) return latest;
    if (!latest) return s.lastSyncAt;
    return s.lastSyncAt > latest ? s.lastSyncAt : latest;
  }, null);
}

export type SyncManagerProps = {
  sources: SyncSource[];
  onOpen?: () => void;
  /** Open the status panel above the trigger — for bottom-anchored clusters. */
  dropUp?: boolean;
};

const HOVER_LEAVE_DELAY_MS = 150;
/** Panel width — must stay in sync with the `w-[210px]` class on the menu. */
const PANEL_WIDTH = 210;
const VIEWPORT_MARGIN = 8;

export function SyncManager({ sources, onOpen, dropUp = false }: SyncManagerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // The panel defaults to right-anchored (opens leftward), which fits the
  // far-right position it holds in the top header. In the sidebar rail the
  // trigger sits at the far LEFT of the screen, so opening leftward would push
  // the 210px panel off the left viewport edge. Measure on open and flip to
  // left-anchored (open rightward) when the right-anchored panel would clip.
  const [alignLeft, setAlignLeft] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncFailed, setSyncFailed] = useState(false);
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
  const anySyncing =
    visibleSources.some((s) => s.syncing) || syncingIds.size > 0;
  const lastSyncAt = latestLastSyncAt(visibleSources);

  useEffect(() => {
    if (!hasDirty && !anySyncing) {
      setSyncFailed(false);
    }
  }, [hasDirty, anySyncing]);

  // Pick the horizontal anchor whenever the panel opens. Right-anchored by
  // default; flip to left-anchored only when opening leftward would clip the
  // left viewport edge. Runs pre-paint so there's no flash of misalignment.
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setAlignLeft(rect.right - PANEL_WIDTH < VIEWPORT_MARGIN);
  }, [open]);

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

  const handleSyncNow = async () => {
    const dirty = visibleSources.filter(
      (s) => s.dirtyCount > 0 && !s.syncing && !syncingIds.has(s.id),
    );
    if (dirty.length === 0) return;
    setSyncingIds((prev) => new Set([...prev, ...dirty.map((s) => s.id)]));
    let rejected = false;
    try {
      const results = await Promise.allSettled(dirty.map((s) => s.onSyncNow()));
      rejected = results.some((r) => r.status === "rejected");
      onOpen?.();
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        for (const s of dirty) next.delete(s.id);
        return next;
      });
      // Only mark failed on thrown errors — dirtyCount in props can lag one
      // frame after a successful draft sync (step events still local).
      setSyncFailed(rejected);
    }
  };

  const showError = syncFailed && !anySyncing;
  const showDirty = hasDirty && !showError;

  if (visibleSources.length === 0) return null;

  return (
    <div
      ref={ref}
      className="group/sync relative flex items-center"
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
        onClick={() => {
          if (showDirty || showError) {
            void handleSyncNow();
            return;
          }
          setOpen((o) => !o);
        }}
        className={cn(
          "group/trigger relative flex h-9 w-9 items-center justify-center transition-colors",
          showError && "text-error",
          showDirty && "text-warning hover:text-accent",
          !showDirty && !showError && "text-success",
        )}
        aria-expanded={open}
        aria-haspopup="true"
        title={
          showError
            ? t("syncManager.syncFailed", { defaultValue: "Sync failed — try again" })
            : showDirty
              ? t("syncManager.hasPending", {
                  defaultValue: "Progress waiting to sync — hover or click to upload",
                })
              : t("syncManager.upToDate", { defaultValue: "Progress synced to cloud" })
        }
      >
        {anySyncing ? (
          <Spinner
            size="sm"
            className="text-current"
            label={t("syncManager.syncing", { defaultValue: "Syncing" })}
          />
        ) : showError ? (
          <Icon name="cloudAlert" size={20} strokeWidth={1.75} />
        ) : (
          <>
            <Icon
              name="cloud"
              size={20}
              strokeWidth={1.5}
              className={cn(
                "transition-opacity duration-150",
                showDirty && "group-hover/trigger:opacity-0",
              )}
            />
            {showDirty ? (
              <Icon
                name="cloudSync"
                size={20}
                strokeWidth={1.75}
                className="absolute opacity-0 transition-opacity duration-150 group-hover/trigger:opacity-100"
                aria-hidden
              />
            ) : null}
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-[210px] rounded-lg border border-border bg-surface py-2 shadow-popover",
            alignLeft ? "left-0" : "right-0",
            dropUp ? "bottom-full mb-1" : "top-full -mt-1",
          )}
          role="menu"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-2.5 pb-1.5">
            <span className="text-xs font-semibold text-text-primary">
              {t("syncManager.titleShort", { defaultValue: "Sync" })}
            </span>
            {showError ? (
              <Icon name="cloudAlert" size={14} className="text-error" aria-hidden />
            ) : showDirty ? (
              <button
                type="button"
                onClick={() => void handleSyncNow()}
                disabled={anySyncing}
                className="flex h-7 w-7 items-center justify-center rounded-md text-accent transition hover:bg-accent-muted disabled:opacity-50"
                title={t("syncManager.syncNow", { defaultValue: "Sync now" })}
                aria-label={t("syncManager.syncNow", { defaultValue: "Sync now" })}
              >
                <Icon
                  name="cloudSync"
                  size={15}
                  strokeWidth={2}
                  className={cn(anySyncing && "animate-pulse")}
                />
              </button>
            ) : (
              <Icon name="cloud" size={14} className="text-success" aria-hidden />
            )}
          </div>

          <ul className="px-1.5 py-1">
            {visibleSources.map((source) => {
              const synced = source.dirtyCount === 0;
              const busy = source.syncing || syncingIds.has(source.id);

              return (
                <li
                  key={source.id}
                  className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs"
                >
                  <span className="truncate text-text-secondary">{source.label}</span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      showError && !synced && "text-error",
                      !showError && synced && "text-success",
                      !showError && !synced && "text-warning",
                      busy && "text-text-muted",
                    )}
                  >
                    {busy ? (
                      t("syncManager.syncingShort", { defaultValue: "…" })
                    ) : synced ? (
                      <Icon name="check" size={12} strokeWidth={3} aria-hidden />
                    ) : (
                      source.dirtyCount
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          {showError ? (
            <p className="border-t border-border px-2.5 pt-1.5 text-[10px] text-error">
              {t("syncManager.syncFailedHint", {
                defaultValue: "Couldn’t upload — tap the cloud to retry",
              })}
            </p>
          ) : null}

          {showDirty && visibleSources.some((s) => s.nextSyncAt) ? (
            <p className="border-t border-border px-2.5 pt-1.5 text-[10px] text-text-muted">
              {t("syncManager.autoSoon", {
                time: formatTimeUntil(
                  visibleSources.find((s) => s.nextSyncAt)?.nextSyncAt ?? "",
                ),
                defaultValue: "Auto-sync in {{time}}",
              })}
            </p>
          ) : null}

          {!showDirty && !showError && lastSyncAt ? (
            <p className="border-t border-border px-2.5 pt-1.5 text-[10px] text-text-muted">
              {t("syncManager.lastSync", {
                time: formatTimeAgo(lastSyncAt),
                defaultValue: "Last sync: {{time}}",
              })}
            </p>
          ) : null}

          {!showDirty && !showError && !lastSyncAt ? (
            <p className="border-t border-border px-2.5 pt-1.5 text-[10px] text-text-muted">
              {t("syncManager.neverSynced", { defaultValue: "Not synced yet" })}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

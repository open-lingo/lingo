import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { hasLessonProgressReset, lessonProgressResetStorageKey } from "@/shared/domain/mockProgress";
import { pullFromServerIgnoringReset, type PullIgnoringResetResult } from "./pullFromServerIgnoringReset";

/**
 * Bug #176a diagnostic: server has 12/12 lessons for a module, a device
 * shows fewer. Leading hypothesis is the local "lesson progress reset" flag
 * (see `mockProgress.ts`) stuck set on that device, silently blocking every
 * server→local merge `useProgressMe` would otherwise do. Surfaces the flag
 * + both counts so Spencer can confirm the hypothesis on his own phone, and
 * a one-tap override that doesn't change the default (flag-respecting)
 * merge path anywhere else.
 */
export function ResetDiagnosticsPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { summary } = useProgressMe();
  const localIds = useCompletedLessonIds();
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<PullIgnoringResetResult | null>(null);

  const resetActive = hasLessonProgressReset();
  const storageKey = lessonProgressResetStorageKey();
  const serverCount = summary ? summary.lessons.filter((l) => l.firstPassedAt).length : null;
  const queryKey = ["progress", "me", user?.sub ?? "anon"];

  const handlePull = async () => {
    setPulling(true);
    try {
      const r = await pullFromServerIgnoringReset(queryClient, queryKey);
      setResult(r);
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="space-y-1 border-t border-border pt-1.5">
      <span className="text-[10px] font-semibold text-text-primary">
        {t("syncManager.resetDiag.title", { defaultValue: "Sync diagnostics (#176a)" })}
      </span>
      <p className="text-[10px] text-text-secondary">
        {t("syncManager.resetDiag.flag", {
          defaultValue: "Reset flag: {{state}}",
          state: resetActive
            ? t("syncManager.resetDiag.flagSet", { defaultValue: "SET" })
            : t("syncManager.resetDiag.flagClear", { defaultValue: "clear" }),
        })}
      </p>
      <p className="truncate text-[9px] text-text-muted" title={storageKey}>
        {storageKey}
      </p>
      <p className="text-[10px] text-text-secondary">
        {t("syncManager.resetDiag.counts", {
          defaultValue: "Local {{local}} / Server {{server}}",
          local: localIds.length,
          server:
            serverCount ?? t("syncManager.resetDiag.notLoaded", { defaultValue: "not loaded" }),
        })}
      </p>
      <button
        type="button"
        onClick={() => void handlePull()}
        disabled={pulling}
        className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent-muted disabled:opacity-50"
      >
        {pulling
          ? t("syncManager.resetDiag.pulling", { defaultValue: "Pulling…" })
          : t("syncManager.resetDiag.pull", {
              defaultValue: "Pull from server (ignore local reset)",
            })}
      </button>
      {result ? (
        <p className="text-[10px] text-success">
          {t("syncManager.resetDiag.pulled", {
            defaultValue: "Now: local {{local}} / server {{server}}",
            local: result.localCount,
            server: result.serverCount ?? "?",
          })}
        </p>
      ) : null}
    </div>
  );
}

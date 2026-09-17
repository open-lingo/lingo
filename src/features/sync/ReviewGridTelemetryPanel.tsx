import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import {
  subscribeSessionLog,
  summarizeReviewGridEvents,
} from "@/shared/telemetry/sessionLog";

/**
 * A8 (2026-09-17, docs/learning-loop-2026-09-17.md) — dev-only read of the
 * `review_grid_served` telemetry this session has logged: "of the due
 * atoms the store reported, how much of what we served lined up with
 * them." Always-on instrumentation (not the `reviewGridsFromFsrs`
 * selection flag, which is off by default) — this panel just reads it.
 *
 * `latestDueAtomCount` is a snapshot from the most recently served step,
 * not a running total — see `summarizeReviewGridEvents`'s doc comment for
 * why the "served" number is a sum (can double-count one atom served by
 * two steps) rather than a unique-atom count.
 */
export function ReviewGridTelemetryPanel() {
  const { t } = useTranslation();
  const summary = useSyncExternalStore(
    subscribeSessionLog,
    summarizeReviewGridEvents,
    summarizeReviewGridEvents,
  );

  if (summary.stepsServed === 0) return null;

  return (
    <div className="space-y-1 border-t border-border pt-1.5">
      <span className="text-[10px] font-semibold text-text-primary">
        {t("syncManager.reviewGridTelemetry.title", {
          defaultValue: "Review-grid FSRS overlap (A8)",
        })}
      </span>
      <p className="text-[10px] text-text-secondary">
        {t("syncManager.reviewGridTelemetry.steps", {
          defaultValue: "{{steps}} graded steps across {{lessons}} lessons",
          steps: summary.stepsServed,
          lessons: summary.lessonsSeen,
        })}
      </p>
      <p className="text-[10px] text-text-secondary">
        {t("syncManager.reviewGridTelemetry.overlap", {
          defaultValue: "{{overlap}} of {{served}} served atom-slots were due ({{rate}}%)",
          overlap: summary.totalOverlap,
          served: summary.totalAtomSlotsServed,
          rate: Math.round(summary.overlapRate * 100),
        })}
      </p>
      <p className="text-[10px] text-text-muted">
        {t("syncManager.reviewGridTelemetry.dueSnapshot", {
          defaultValue: "Due atoms as of last step: {{due}}",
          due: summary.latestDueAtomCount,
        })}
      </p>
    </div>
  );
}

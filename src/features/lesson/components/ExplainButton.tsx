/**
 * ExplainButton — sentence-level "?" affordance on graded sentence-content steps.
 *
 * Visibility gating:
 *   - Hidden when no `explanation` is provided.
 *   - Hidden pre-commit (before any wrong submit) until `dwellMsThreshold` has
 *     elapsed since mount.
 *   - Appears immediately after a wrong submit OR after the dwell window.
 *
 * Click toggles an inline expansion containing the authored explanation. This
 * is language-agnostic and reads no language-specific helpers.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

type Props = {
  explanation: string | undefined;
  hasSubmittedWrong: boolean;
  dwellMsThreshold?: number;
  /**
   * "floating" (default, unchanged): absolutely positioned top-right of the
   * nearest `relative` ancestor — every existing call site.
   * "inline" (TestFlight #70c, ParticleClozeStepView 2026-09-14): sits in
   * normal flow so a caller can put it in the same flex row as its step
   * label instead of it floating independently at the container's top edge
   * (the two anchors used to line up only by coincidence, leaving dead
   * space). The expansion panel keeps `w-full` in both modes so it still
   * drops onto its own line when a flex-wrap parent is used.
   */
  layout?: "floating" | "inline";
};

export function ExplainButton({
  explanation,
  hasSubmittedWrong,
  dwellMsThreshold = 15_000,
  layout = "floating",
}: Props) {
  const { t } = useTranslation();
  const [dwellElapsed, setDwellElapsed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDwellElapsed(true), dwellMsThreshold);
    return () => clearTimeout(timer);
  }, [dwellMsThreshold]);

  if (!explanation) return null;
  if (!hasSubmittedWrong && !dwellElapsed) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("lesson.explainQuestion", "Explain this question")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-text-muted/30 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary ${
          layout === "inline" ? "" : "absolute right-2 top-2"
        }`}
        title={t("lesson.explainQuestion", "Explain this question")}
      >
        <Icon name="help" size={14} aria-hidden />
      </button>
      {open && (
        <div className="mt-2 w-full rounded-lg border border-info/40 bg-info/5 px-4 py-3 text-sm text-text-secondary">
          {explanation}
        </div>
      )}
    </>
  );
}

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
import { Icon } from "@/shared/components/Icon";

type Props = {
  explanation: string | undefined;
  hasSubmittedWrong: boolean;
  dwellMsThreshold?: number;
};

export function ExplainButton({
  explanation,
  hasSubmittedWrong,
  dwellMsThreshold = 15_000,
}: Props) {
  const [dwellElapsed, setDwellElapsed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDwellElapsed(true), dwellMsThreshold);
    return () => clearTimeout(t);
  }, [dwellMsThreshold]);

  if (!explanation) return null;
  if (!hasSubmittedWrong && !dwellElapsed) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Explain this question"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-text-muted/30 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        title="Explain this question"
      >
        <Icon name="help" size={14} aria-hidden />
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-info/40 bg-info/5 px-4 py-3 text-sm text-text-secondary">
          {explanation}
        </div>
      )}
    </>
  );
}

import { useTranslation } from "react-i18next";
import type { AdaptiveState } from "../engine/adaptiveEngine";

type Props = {
  state: AdaptiveState;
  isTestOut?: boolean;
  testOutModuleLabel?: string;
  /** Total questions in this test-out's derived set (the denominator). The
   *  derived set is ~12 (was a fixed 3-item bank — don't hardcode). */
  testOutTotal?: number;
  /** Total questions this banded run will serve (~sample modules × per-module
   *  budget). Used as the denominator so the bar fills honestly. */
  samplingTotal?: number;
};

export function PlacementProgressBar({
  state,
  isTestOut,
  testOutModuleLabel,
  testOutTotal,
  samplingTotal,
}: Props) {
  const { t } = useTranslation();
  if (isTestOut) {
    const answered = Object.values(state.probeResults).flat().length;
    const total = Math.max(testOutTotal ?? answered, answered, 1);
    const pct = Math.min(100, (answered / total) * 100);
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-sm text-text-secondary">
          {/* `min-w-0 truncate` is load-bearing, not polish. This label
              interpolates a MODULE TITLE of arbitrary length, and the shell
              below it is fixed-height — so on a 360px screen "Test out · Time I
              and the plain past" wrapped to two lines and took ~19px straight
              out of the step's stage. Measured: the stage scroller overflowed
              by exactly 19px at 360×640 (stage-fit gate, 2026-08-06), which
              clipped the Check button. A header in a fixed shell must have a
              height that does not depend on its content. */}
          <span className="min-w-0 truncate">
            {t("placement.testOutLabel", {
              defaultValue: "Test out · {{module}}",
              module: testOutModuleLabel ?? state.currentProbeModule,
            })}
          </span>
          <span className="shrink-0">
            {answered} / {total}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // Banded self-declared-level run: fill against the total questions the
  // sample will serve.
  const answered = Object.values(state.probeResults).flat().length;
  const total = Math.max(samplingTotal ?? answered, answered, 1);
  const pct = Math.min(100, Math.round((answered / total) * 100));

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{t("placement.promptTitle", "Placement Test")}</span>
        <span>
          {answered} / {total}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

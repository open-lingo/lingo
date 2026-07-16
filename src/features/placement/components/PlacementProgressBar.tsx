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
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>
            {t("placement.testOutLabel", {
              defaultValue: "Test out · {{module}}",
              module: testOutModuleLabel ?? state.currentProbeModule,
            })}
          </span>
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

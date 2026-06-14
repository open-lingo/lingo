import { useTranslation } from "react-i18next";
import type { AdaptiveState } from "../engine/adaptiveEngine";
import { SKILL_TIERS } from "../tiers";

type Props = {
  state: AdaptiveState;
  isTestOut?: boolean;
  testOutModuleLabel?: string;
};

export function PlacementProgressBar({ state, isTestOut, testOutModuleLabel }: Props) {
  const { t } = useTranslation();
  if (isTestOut) {
    const answered = Object.values(state.probeResults).flat().length;
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>
            {t("placement.testOutLabel", {
              defaultValue: "Test out · {{module}}",
              module: testOutModuleLabel ?? state.currentProbeModule,
            })}
          </span>
          <span>{answered} / 3</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${(answered / 3) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  const isScreening = state.stage === "screening";
  const screeningCount = Object.keys(state.screeningResults).length;
  const probeAnswered = Object.values(state.probeResults).flat().length;

  const label = isScreening
    ? t("placement.screeningLabel", {
        defaultValue: "Screening · {{done}} / {{total}}",
        done: screeningCount,
        total: SKILL_TIERS.length,
      })
    : t("placement.probingLabel", {
        defaultValue: "Probing · {{module}}",
        module: state.currentProbeModule?.toUpperCase() ?? "",
      });

  const total = isScreening ? SKILL_TIERS.length : SKILL_TIERS.length + probeAnswered;
  const done = isScreening ? screeningCount : SKILL_TIERS.length + probeAnswered;
  const pct = Math.min(100, Math.round((done / Math.max(total, 1)) * 100));

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{t("placement.promptTitle", "Placement Test")}</span>
        <span>{label}</span>
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

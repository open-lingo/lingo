import type { AdaptiveState } from "../engine/adaptiveEngine";
import { SKILL_TIERS } from "../tiers";

type Props = {
  state: AdaptiveState;
  isTestOut?: boolean;
  testOutModuleLabel?: string;
};

export function PlacementProgressBar({ state, isTestOut, testOutModuleLabel }: Props) {
  if (isTestOut) {
    const answered = Object.values(state.probeResults).flat().length;
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Test out · {testOutModuleLabel ?? state.currentProbeModule}</span>
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
    ? `Screening · ${screeningCount} / ${SKILL_TIERS.length}`
    : `Probing · ${state.currentProbeModule?.toUpperCase() ?? ""}`;

  const total = isScreening ? SKILL_TIERS.length : SKILL_TIERS.length + probeAnswered;
  const done = isScreening ? screeningCount : SKILL_TIERS.length + probeAnswered;
  const pct = Math.min(100, Math.round((done / Math.max(total, 1)) * 100));

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>Placement Test</span>
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

import type { InfoStep } from "../../types";
import { ContinueButton } from "../ContinueButton";

type Props = {
  step: InfoStep;
  onContinue: () => void;
};

const variantConfig: Record<
  NonNullable<InfoStep["variant"]>,
  { icon: string; border: string; bg: string; text: string }
> = {
  default: {
    icon: "ℹ️",
    border: "border-border",
    bg: "bg-surface",
    text: "text-text-secondary",
  },
  tip: {
    icon: "💡",
    border: "border-warning/40",
    bg: "bg-warning/10",
    text: "text-text-secondary",
  },
  culture: {
    icon: "🌏",
    border: "border-info/40",
    bg: "bg-info/10",
    text: "text-text-secondary",
  },
  grammar: {
    icon: "📝",
    border: "border-info/40",
    bg: "bg-info/10",
    text: "text-text-secondary",
  },
};

export function InfoStepView({ step, onContinue }: Props) {
  const v = variantConfig[step.variant ?? "default"];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {step.title && (
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          {step.title}
        </h2>
      )}

      <div className={`rounded-2xl border-[1.5px] ${v.border} ${v.bg} px-5 py-5 shadow-[var(--shadow-card)]`}>
        <div className="flex gap-3">
          <span className="mt-0.5 text-2xl leading-none">{v.icon}</span>
          <p className={`text-base leading-relaxed ${v.text}`}>{step.body}</p>
        </div>
      </div>

      <ContinueButton onClick={onContinue} />
    </div>
  );
}

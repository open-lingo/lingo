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
    border: "border-gray-200 dark:border-gray-700",
    bg: "bg-gray-50 dark:bg-gray-800/50",
    text: "text-gray-800 dark:text-gray-200",
  },
  tip: {
    icon: "💡",
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-900 dark:text-amber-200",
  },
  culture: {
    icon: "🌏",
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-900 dark:text-purple-200",
  },
  grammar: {
    icon: "📝",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-900 dark:text-blue-200",
  },
};

export function InfoStepView({ step, onContinue }: Props) {
  const v = variantConfig[step.variant ?? "default"];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {step.title && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {step.title}
        </h2>
      )}

      <div className={`rounded-xl border ${v.border} ${v.bg} px-5 py-4`}>
        <div className="flex gap-3">
          <span className="mt-0.5 text-xl leading-none">{v.icon}</span>
          <p className={`text-base leading-relaxed ${v.text}`}>{step.body}</p>
        </div>
      </div>

      <ContinueButton onClick={onContinue} />
    </div>
  );
}

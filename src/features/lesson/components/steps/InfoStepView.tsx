import type { InfoStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { playSfx } from "@/shared/audio/sfx";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

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
  // Culture cards are typically lesson openers / closers — give them
  // more presence: gradient pane, oversized emoji, larger headline.
  culture: {
    icon: "🌏",
    border: "border-info/40",
    bg: "bg-gradient-to-br from-info/15 via-info/10 to-accent/10",
    text: "text-text-secondary",
  },
  grammar: {
    icon: "📝",
    border: "border-info/40",
    bg: "bg-info/10",
    text: "text-text-secondary",
  },
  // Win cards mark the end of a row — "real-world payoff" copy. Gold
  // gradient tone matches the mastery-star + Mastered pill so the
  // visual rhymes across the pathway.
  win: {
    icon: "🏆",
    border: "border-warning/50",
    bg: "bg-gradient-to-br from-warning/20 via-warning/10 to-accent/10",
    text: "text-text-secondary",
  },
};

export function InfoStepView({ step, onContinue }: Props) {
  const v = variantConfig[step.variant ?? "default"];
  const variant = step.variant ?? "default";
  const isHero = variant === "culture" || variant === "win";

  useLessonKeyboard({ onEnter: () => handleContinue() });

  const handleContinue = () => {
    // Passive — non-progress chirp + light haptic. See sfx.ts.
    playSfx("passive-advance");
    onContinue();
  };

  // Hero variants (culture + win) get a tall card treatment: emoji
  // floats above a big title, body sits in larger relaxed type. Every
  // other variant keeps its compact two-column layout.
  if (isHero) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div
          className={`relative overflow-hidden rounded-3xl border-2 ${v.border} ${v.bg} px-7 py-9 shadow-[var(--shadow-card)]`}
        >
          <span className="block text-6xl leading-none" aria-hidden>
            {v.icon}
          </span>
          {step.title && (
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
              {step.title}
            </h2>
          )}
          <p
            className={`mt-4 text-lg leading-relaxed ${v.text} sm:text-xl`}
          >
            {step.body}
          </p>
        </div>
        <ContinueButton onClick={handleContinue} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {step.title && (
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {step.title}
        </h2>
      )}

      <div
        className={`rounded-2xl border-2 ${v.border} ${v.bg} px-6 py-6 shadow-[var(--shadow-card)]`}
      >
        <div className="flex gap-4">
          <span className="mt-0.5 text-3xl leading-none">{v.icon}</span>
          <p className={`text-lg leading-relaxed ${v.text}`}>{step.body}</p>
        </div>
      </div>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}

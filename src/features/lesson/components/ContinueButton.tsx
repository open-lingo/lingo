import { useTranslation } from "react-i18next";

type Props = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "primary" | "correct" | "incorrect";
};

/**
 * Primary CTA for every step view ("Check" / "Continue" / "I said it!").
 *
 * The 3D-lift treatment mirrors the Learn page pathway buttons: a flat
 * accent fill with a hard offset shadow in `--color-accent-hover`. Hover
 * nudges the button up 1px (shadow grows), active pushes it down 1px
 * (shadow collapses) — same press feel as the start-flag pill.
 *
 * `incorrect` deliberately reuses the same accent-green look as `correct`
 * — the error signal already lives in the wrong-option pill (red) and the
 * "Not quite" banner. Doubling that with a red CTA reads as scolding
 * (retiree audit P0). Keep teaching, never scold.
 */
const variantStyles: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "border-accent-hover bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-hover)] hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)] disabled:hover:translate-y-0 disabled:hover:shadow-[0_3px_0_0_var(--color-accent-hover)]",
  correct:
    "border-accent-hover bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-hover)] hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]",
  incorrect:
    "border-accent-hover bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-hover)] hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]",
};

export function ContinueButton({ onClick, label, disabled, variant = "primary" }: Props) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl border-[1.5px] px-6 py-3.5 text-base font-bold uppercase tracking-wide transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]}`}
    >
      {label ?? t("lesson.continue", "Continue")}
    </button>
  );
}

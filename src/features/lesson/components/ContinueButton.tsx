import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";

type Props = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  /**
   * Retained for callsite compatibility. All three currently render
   * identically — the error signal lives in the wrong-option pill (red)
   * and the "Not quite" banner. Doubling that with a red CTA reads as
   * scolding (retiree audit P0). Keep teaching, never scold.
   */
  variant?: "primary" | "correct" | "incorrect";
};

/**
 * Lesson-step primary CTA ("Check" / "Continue" / "I said it!"). Thin
 * wrapper over `Button variant="primary-3d"` — same 3D-lift treatment
 * as the landing CTAs and the post-lesson summary, full-width by default
 * to match the existing lesson layout. Kept as a named component so the
 * 17 step views read clearly and to centralize the width default.
 */
export function ContinueButton({ onClick, label, disabled, variant: _variant = "primary" }: Props) {
  const { t } = useTranslation();
  return (
    <Button
      variant="primary-3d"
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:min-h-14 sm:text-lg"
    >
      {label ?? t("lesson.continue", "Continue")}
    </Button>
  );
}

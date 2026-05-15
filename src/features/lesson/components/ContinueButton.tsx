import { useTranslation } from "react-i18next";

type Props = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "primary" | "correct" | "incorrect";
};

const variantStyles: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
  correct:
    "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
  incorrect:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
};

export function ContinueButton({ onClick, label, disabled, variant = "primary" }: Props) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl px-6 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]}`}
    >
      {label ?? t("lesson.continue", "Continue")}
    </button>
  );
}

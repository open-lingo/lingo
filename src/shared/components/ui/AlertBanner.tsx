import { cn } from "./cn";

export type AlertVariant = "error" | "success" | "warning" | "info";

const variantClasses: Record<AlertVariant, string> = {
  error: "border-error/40 bg-error/10 text-error",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-info/40 bg-info/10 text-info",
};

type AlertBannerProps = {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
};

/** Inline alert using semantic theme tokens (customizable per theme). */
export function AlertBanner({
  variant = "error",
  children,
  className,
}: AlertBannerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variantClasses[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  );
}

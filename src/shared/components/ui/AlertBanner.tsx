import { type ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "./cn";

export type AlertVariant = "info" | "success" | "warning" | "error";

const variantClasses: Record<AlertVariant, string> = {
  info: "border-info/30 bg-info/10 text-info",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-error/30 bg-error/10 text-error",
};

const variantIcons: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export type AlertBannerProps = {
  variant?: AlertVariant;
  /** Optional heading text. */
  title?: string;
  /** Body / description content. */
  children?: ReactNode;
  /** Right-aligned actions slot (e.g. retry button). */
  actions?: ReactNode;
  /** Hide the leading variant icon. */
  hideIcon?: boolean;
  /** When provided, renders a dismiss button. */
  onDismiss?: () => void;
  /** ARIA label for the dismiss button. */
  dismissLabel?: string;
  className?: string;
};

/**
 * Inline alert / banner with variant styling.
 *
 * Mobile behavior: actions wrap below the message when there isn't horizontal
 * room.
 */
export function AlertBanner({
  variant = "info",
  title,
  children,
  actions,
  hideIcon,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
}: AlertBannerProps) {
  const Icon = variantIcons[variant];
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
    >
      {!hideIcon && (
        <span className="mt-0.5 shrink-0">
          <Icon size={18} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold leading-tight">{title}</p>}
        {children && (
          <div className={cn("text-text-secondary", title && "mt-1")}>{children}</div>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-mr-1 shrink-0 rounded p-1 text-current opacity-70 transition hover:opacity-100"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

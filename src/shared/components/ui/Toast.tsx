import { X } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "./cn";

export type ToastVariant = "success" | "error" | "info" | "warning";

const variantClasses: Record<ToastVariant, string> = {
  success: "border-success/40 bg-success/10 text-text-primary",
  error: "border-error/40 bg-error/10 text-text-primary",
  info: "border-info/40 bg-info/10 text-text-primary",
  warning: "border-warning/40 bg-warning/10 text-text-primary",
};

export type ToastProps = {
  variant?: ToastVariant;
  /** Toast message. */
  children: ReactNode;
  /** Optional icon at the start. */
  icon?: ReactNode;
  /** Show a dismiss button. */
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
};

/**
 * Single toast surface. Use this when rendering toasts outside of the global
 * `ToastContainer` (e.g. inline preview, Storybook-style demos). The shared
 * runtime toast queue lives in `ToastContext` + `ToastContainer`.
 *
 * Mobile behavior: full-width by default; constrain with `max-w-*` at the call
 * site if needed.
 */
export function Toast({
  variant = "info",
  children,
  icon,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
}: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-card",
        variantClasses[variant],
        className,
      )}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-mr-1 -mt-0.5 shrink-0 rounded p-1 opacity-70 hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

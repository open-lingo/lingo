import { cn } from "./cn";
import { Spinner, type SpinnerSize } from "./Spinner";

export type CenteredLoaderProps = {
  /** Spinner size. Default `md`. */
  size?: SpinnerSize;
  /** Vertical padding token. Default `md`. */
  py?: "sm" | "md" | "lg" | "xl";
  /** Optional accessible label. */
  label?: string;
  /** Optional descriptive text rendered below the spinner. */
  message?: string;
  className?: string;
};

const pyClasses: Record<NonNullable<CenteredLoaderProps["py"]>, string> = {
  sm: "py-6",
  md: "py-10",
  lg: "py-16",
  xl: "py-24",
};

/**
 * Full-area centered spinner with optional caption.
 *
 * Mobile behavior: stretches full width, vertical padding shrinks naturally.
 */
export function CenteredLoader({
  size = "md",
  py = "md",
  label,
  message,
  className,
}: CenteredLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 text-text-muted",
        pyClasses[py],
        className,
      )}
    >
      <Spinner size={size} label={label} />
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}

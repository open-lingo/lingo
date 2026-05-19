import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/shared/components/ui/cn";

export type ProgressRowProps = {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  /** 0–100 */
  progress?: number;
  rightChip?: ReactNode;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ProgressRow({
  icon,
  label,
  sublabel,
  progress,
  rightChip,
  to,
  onClick,
  disabled,
  className,
}: ProgressRowProps) {
  const interactive = !disabled && (Boolean(to) || Boolean(onClick));
  const clamped = progress == null ? null : Math.max(0, Math.min(100, progress));

  const inner = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{label}</p>
        {sublabel ? (
          <p className="truncate text-xs text-text-muted">{sublabel}</p>
        ) : null}
        {clamped != null ? (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${clamped}%` }}
            />
          </div>
        ) : null}
      </div>
      {rightChip ? <div className="shrink-0">{rightChip}</div> : null}
    </>
  );

  const baseClass = cn(
    "flex items-center gap-3 rounded-lg border border-border bg-surface p-3",
    interactive && "transition hover:border-accent hover:bg-surface-muted",
    disabled && "opacity-60",
    className,
  );

  if (to && interactive) {
    return (
      <Link to={to} className={baseClass}>
        {inner}
      </Link>
    );
  }
  if (onClick && interactive) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClass, "text-left")}>
        {inner}
      </button>
    );
  }
  return <div className={baseClass}>{inner}</div>;
}

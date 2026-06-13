import type { ReactNode } from "react";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { IconName } from "@/shared/iconRegistry";

/**
 * Compact FSRS stat tile for the practice overview bar. Tone "accent"
 * highlights the most actionable number (cards due); "default" is the
 * neutral surface for supporting stats.
 */
export function PracticeStatTile({
  icon,
  value,
  label,
  caption,
  tone = "default",
  children,
}: {
  icon: IconName;
  value: ReactNode;
  label: string;
  caption?: string;
  tone?: "default" | "accent";
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-xl border px-3 py-2.5",
        tone === "accent"
          ? "border-accent/40 bg-accent-muted"
          : "border-border bg-surface-muted",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          name={icon}
          size={14}
          aria-hidden
          className={tone === "accent" ? "text-accent" : "text-text-muted"}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </span>
      </div>
      {children ?? (
        <span
          className={cn(
            "text-2xl font-extrabold leading-none",
            tone === "accent" ? "text-accent" : "text-text-primary",
          )}
        >
          {value}
        </span>
      )}
      {caption ? (
        <span className="truncate text-[11px] leading-tight text-text-muted">
          {caption}
        </span>
      ) : null}
    </div>
  );
}

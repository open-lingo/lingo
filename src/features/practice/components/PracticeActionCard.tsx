import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { IconName } from "@/shared/iconRegistry";

/**
 * Compact learning-action card for the practice hub "Continue learning"
 * grid. Replaces the oversized PracticeHubSection hero cards — same
 * destinations, a third of the height. `count` renders a small pill
 * (e.g. cards due); `emphasis="accent"` marks the primary CTA.
 */
export function PracticeActionCard({
  to,
  icon,
  title,
  description,
  count,
  emphasis = "default",
}: {
  to: string;
  icon: IconName;
  title: string;
  description: string;
  count?: number;
  emphasis?: "default" | "accent";
}) {
  const isAccent = emphasis === "accent";
  return (
    <Link
      to={to}
      className={cn(
        "group flex min-w-0 flex-col gap-2 rounded-card border p-3.5 transition sm:p-4",
        isAccent
          ? "border-accent bg-accent-muted hover:border-accent hover:bg-accent hover:text-accent-foreground"
          : "border-border bg-surface hover:border-accent hover:bg-surface-muted",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            isAccent
              ? "bg-accent/15 text-accent group-hover:bg-white/20 group-hover:text-accent-foreground"
              : "bg-surface-muted text-accent",
          )}
          aria-hidden
        >
          <Icon name={icon} size={20} />
        </span>
        {typeof count === "number" && count > 0 ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              isAccent
                ? "bg-accent text-accent-foreground group-hover:bg-white/25"
                : "bg-accent-muted text-accent",
            )}
          >
            {count}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold leading-tight",
            isAccent ? "text-accent group-hover:text-accent-foreground" : "text-text-primary",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 text-pretty text-xs leading-snug",
            isAccent
              ? "text-accent/80 group-hover:text-accent-foreground/90"
              : "text-text-secondary",
          )}
        >
          {description}
        </p>
      </div>
      <span
        className={cn(
          "mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold",
          isAccent ? "text-accent group-hover:text-accent-foreground" : "text-accent",
        )}
      >
        <Icon name="arrowBigRight" size={14} className="rtl:rotate-180" aria-hidden />
      </span>
    </Link>
  );
}

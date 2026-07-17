import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { Pillar } from "@/features/practice/pillars";

/**
 * Big "mode select" tile for one SLA pillar on the practice hub. `default`
 * shows the tagline + activity preview; `game` is a compact, centered
 * game-menu tile (icon pops/tilts on hover) used on the revamped hub.
 * `badge` renders a count pill (e.g. SRS cards due on Vocabulary).
 */
export function PillarTile({
  pillar,
  to,
  badge,
  variant = "default",
}: {
  pillar: Pillar;
  to: string;
  badge?: number;
  variant?: "default" | "game";
}) {
  const { t } = useTranslation();

  if (variant === "game") {
    return (
      <Link
        to={to}
        className={cn(
          "group relative flex h-full min-h-[7.5rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-card border border-border bg-surface-elevated p-4 text-center transition",
          "hover:-translate-y-1 hover:border-accent hover:shadow-lg",
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        )}
      >
        {typeof badge === "number" && badge > 0 ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
            {badge}
          </span>
        ) : null}
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted text-accent transition",
            "group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground",
            "motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100",
          )}
          aria-hidden
        >
          <Icon name={pillar.icon} size={26} />
        </span>
        <h3 className="text-[0.95rem] font-extrabold tracking-tight text-text-primary">
          {t(pillar.titleKey, { defaultValue: pillar.titleDefault })}
        </h3>
      </Link>
    );
  }

  const preview = pillar.activities
    .slice(0, 3)
    .map((a) => t(a.titleKey, { defaultValue: a.titleDefault }));
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-4 transition",
        "hover:-translate-y-0.5 hover:border-accent hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent transition group-hover:bg-accent group-hover:text-accent-foreground"
          aria-hidden
        >
          <Icon name={pillar.icon} size={24} />
        </span>
        {typeof badge === "number" && badge > 0 ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-extrabold tracking-tight text-text-primary">
          {t(pillar.titleKey, { defaultValue: pillar.titleDefault })}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-text-secondary">
          {t(pillar.taglineKey, { defaultValue: pillar.taglineDefault })}
        </p>
        <p className="mt-1.5 truncate text-[11px] font-medium text-text-muted">
          {preview.join(" · ")}
        </p>
      </div>
    </Link>
  );
}

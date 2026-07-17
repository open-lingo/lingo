import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { Pillar } from "@/features/practice/pillars";

/**
 * "Mode select" tile for one SLA pillar on the practice hub — the entry
 * point into a learning avenue. Shows the pillar icon, name, tagline, and a
 * preview of its first activities; `badge` renders a count pill (e.g. SRS
 * cards due on Vocabulary).
 */
export function PillarTile({
  pillar,
  to,
  badge,
}: {
  pillar: Pillar;
  to: string;
  badge?: number;
}) {
  const { t } = useTranslation();
  const preview = pillar.activities
    .slice(0, 3)
    .map((a) => t(a.titleKey, { defaultValue: a.titleDefault }));
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex h-full min-h-[8.5rem] flex-col justify-center gap-3 overflow-hidden rounded-card border border-border bg-surface p-5 transition",
        "hover:-translate-y-0.5 hover:border-accent hover:shadow-lg",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      {typeof badge === "number" && badge > 0 ? (
        <span className="absolute right-3 top-3 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
          {badge}
        </span>
      ) : null}
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent transition group-hover:bg-accent group-hover:text-accent-foreground motion-reduce:transition-none"
        aria-hidden
      >
        <Icon name={pillar.icon} size={24} />
      </span>
      <div className="min-w-0">
        <h3 className="text-lg font-extrabold tracking-tight text-text-primary">
          {t(pillar.titleKey, { defaultValue: pillar.titleDefault })}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-text-secondary">
          {t(pillar.taglineKey, { defaultValue: pillar.taglineDefault })}
        </p>
        <p className="mt-1.5 truncate text-[0.6875rem] font-medium text-text-muted">
          {preview.join(" · ")}
        </p>
      </div>
    </Link>
  );
}

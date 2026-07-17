import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import type { PracticeStats } from "@/features/practice/hooks/usePracticeStats";
import {
  moduleNumber,
  type QuickStart,
  type Suggestion,
} from "@/features/practice/practiceSuggestion";

const RISE = "animate-[practice-rise_0.5s_ease_both] motion-reduce:animate-none";
const PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-bold text-text-secondary";

/**
 * Practice hub header. Reads the smart suggestion + stats and renders the
 * one-tap spotlight (stat pills → headline → Start CTA → "Jump back in"
 * chips) over a soft accent glow. Presentational — all logic is in
 * `practiceSuggestion.ts`.
 */
export function PracticeHero({
  stats,
  suggestion,
  quickStarts,
  langPath,
}: {
  stats: PracticeStats;
  suggestion: Suggestion;
  quickStarts: QuickStart[];
  langPath: (p: string) => string;
}) {
  const { t } = useTranslation();

  const headline =
    suggestion.kind === "srs"
      ? t("practice.hero.dueTitle", {
          defaultValue: "Ready? {{count}} words are due.",
          count: suggestion.dueCount,
        })
      : suggestion.kind === "module"
        ? t("practice.hero.moduleTitle", {
            defaultValue: "Review Module {{n}}",
            n: moduleNumber(suggestion.moduleId),
          })
        : suggestion.kind === "pillar"
          ? t("practice.hero.pillarTitle", {
              defaultValue: "Caught up — let's sharpen {{pillar}}.",
              pillar: t(suggestion.pillar.titleKey, {
                defaultValue: suggestion.pillar.titleDefault,
              }),
            })
          : t("practice.hero.startTitle", { defaultValue: "Start practicing" });

  const buttonLabel =
    suggestion.kind === "srs" || suggestion.kind === "module"
      ? t("practice.hero.startReview", { defaultValue: "Start review" })
      : t("practice.hero.startPractice", { defaultValue: "Start practice" });

  // "To learn" = course cards not yet started. If `total` reflects only
  // started cards for a language this reads low; swap for a course-deck
  // count when one is cheaply available. Never negative, never fabricated.
  const toLearn = Math.max(0, stats.total - stats.learning - stats.mastered);

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface-elevated p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent-muted opacity-70 blur-3xl"
      />
      <div className="relative">
        <div className={cn("flex flex-wrap items-center gap-2", RISE)}>
          {stats.streak > 0 ? (
            <span className={PILL}>
              <Icon name="flame" size={14} aria-hidden />
              {t("practice.hero.streak", { defaultValue: "{{n}}-day streak", n: stats.streak })}
            </span>
          ) : null}
          <span className={PILL}>
            <Icon name="graduationCap" size={14} aria-hidden />
            <b className="tabular-nums text-text-primary">{toLearn}</b>
            {t("practice.hero.toLearn", { defaultValue: "to learn" })}
          </span>
          <Link
            to={langPath("practice/journey")}
            className={cn(
              PILL,
              "transition hover:border-accent hover:text-accent motion-reduce:transition-none",
            )}
          >
            <Icon name="target" size={14} aria-hidden />
            <b className="tabular-nums text-text-primary">{stats.mastered}</b>
            {t("practice.hero.mastered", { defaultValue: "mastered" })}
          </Link>
        </div>

        <h1
          className={cn(
            "mt-2 text-balance text-xl font-extrabold tracking-tight text-text-primary sm:text-2xl",
            RISE,
            "[animation-delay:60ms]",
          )}
        >
          {headline}
        </h1>

        <div className={cn("mt-3.5", RISE, "[animation-delay:120ms]")}>
          <Link
            to={langPath(suggestion.to)}
            className={composeButtonClasses({ variant: "primary-3d" })}
          >
            <Icon name="play" size={18} aria-hidden />
            {buttonLabel}
          </Link>
        </div>

        {quickStarts.length > 0 ? (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3.5",
              RISE,
              "[animation-delay:180ms]",
            )}
          >
            <span className="mr-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-text-muted">
              {t("practice.hero.jumpBackIn", { defaultValue: "Jump back in" })}
            </span>
            {quickStarts.map((c) => (
              <Link
                key={c.to}
                to={langPath(c.to)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:-translate-y-px hover:border-accent hover:text-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <Icon name={c.icon} size={14} aria-hidden />
                {t(c.labelKey, { defaultValue: c.labelDefault, ...(c.params ?? {}) })}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

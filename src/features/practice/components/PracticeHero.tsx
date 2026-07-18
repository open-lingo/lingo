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
 * Practice hub header — a calm "jump straight in" ribbon. Reads the smart
 * suggestion + stats and renders mini-stat pills, the one-tap spotlight
 * (play + suggestion + Start), and contextual "Jump back in" chips.
 * Presentational — all logic lives in `practiceSuggestion.ts`.
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

  const eyebrow =
    suggestion.kind === "pillar"
      ? t("practice.hero.caughtUp", { defaultValue: "All caught up" })
      : suggestion.kind === "start"
        ? t("practice.hero.getStarted", { defaultValue: "Let's get started" })
        : t("practice.hero.suggested", { defaultValue: "Suggested for you" });

  const headline =
    suggestion.kind === "srs"
      ? t("practice.hero.dueTitle", {
          defaultValue: "Review {{count}} due words",
          count: suggestion.dueCount,
        })
      : suggestion.kind === "module"
        ? t("practice.hero.moduleTitle", {
            defaultValue: "Review Module {{n}}",
            n: moduleNumber(suggestion.moduleId),
          })
        : suggestion.kind === "pillar"
          ? t("practice.hero.pillarTitle", {
              defaultValue: "Sharpen your {{pillar}}",
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
    <div className="rounded-card border border-border bg-surface p-4 sm:p-5">
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

      <div
        className={cn(
          "mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
          RISE,
          "[animation-delay:60ms]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Icon name="play" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[0.68rem] font-bold uppercase tracking-wider text-accent">
              {eyebrow}
            </div>
            <h1 className="text-balance text-lg font-extrabold tracking-tight text-text-primary sm:text-xl">
              {headline}
            </h1>
          </div>
        </div>
        <Link
          to={langPath(suggestion.to)}
          className={composeButtonClasses({ variant: "primary-3d", className: "w-full shrink-0 sm:w-auto" })}
        >
          {buttonLabel}
        </Link>
      </div>

      {quickStarts.length > 0 ? (
        <div
          className={cn(
            "mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3.5",
            RISE,
            "[animation-delay:120ms]",
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
  );
}

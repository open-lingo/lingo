import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import type { DayActivity, UserStats } from "@/shared/api/progress";
import type { LevelProgress } from "../leveling";

type Props = {
  days: DayActivity[];
  user: UserStats;
  level: LevelProgress;
};

/**
 * Social-style secondary column for the Journey page. Compact, glanceable
 * widgets that all read REAL data:
 *   - This week  : last-7-day XP / lessons / active-day roll-up from last30days.
 *   - Up next    : cards due now + XP-to-next-level milestone.
 *   - Quick start: review-due / continue-lesson CTAs.
 *   - Streak     : a 7-day streak strip off the daily activity window.
 */
export function JourneySidebar({ days, user, level }: Props) {
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <ThisWeekCard days={days} />
      <UpNextCard level={level} />
      <QuickStartCard />
      <StreakStripCard days={days} streak={user.streak} />
    </div>
  );
}

/* ── this week ── */

function lastNDays(days: DayActivity[], n: number): DayActivity[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(Math.max(0, sorted.length - n));
}

function ThisWeekCard({ days }: { days: DayActivity[] }) {
  const { t } = useTranslation();
  const week = useMemo(() => lastNDays(days, 7), [days]);
  const xp = week.reduce((s, d) => s + d.xpEarned, 0);
  const lessons = week.reduce((s, d) => s + d.lessonsCompleted, 0);
  const active = week.filter((d) => d.xpEarned > 0 || d.lessonsCompleted > 0).length;

  return (
    <Card as="section" padding="sm" aria-label={t("journey.side.week.title", { defaultValue: "This week" })}>
      <SideHeader icon="calendarDays" title={t("journey.side.week.title", { defaultValue: "This week" })} />
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MiniMetric value={xp.toLocaleString()} label={t("journey.side.week.xp", { defaultValue: "XP" })} />
        <MiniMetric value={String(lessons)} label={t("journey.side.week.lessons", { defaultValue: "Lessons" })} />
        <MiniMetric value={`${active}/7`} label={t("journey.side.week.days", { defaultValue: "Active days" })} />
      </div>
    </Card>
  );
}

/* ── up next (due + milestone) ── */

function UpNextCard({ level }: { level: LevelProgress }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { count: cardsDue, isLoading } = useCardsDueCount(language?.id ?? "ja");
  const xpToNext = Math.max(0, level.toNext - level.intoLevel);

  return (
    <Card as="section" padding="sm" aria-label={t("journey.side.next.title", { defaultValue: "Up next" })}>
      <SideHeader icon="target" title={t("journey.side.next.title", { defaultValue: "Up next" })} />
      <div className="mt-3 space-y-2.5">
        <SideRow
          icon="refresh"
          iconClass="text-warning"
          value={isLoading ? "—" : String(cardsDue)}
          label={t("journey.side.next.due", { defaultValue: "Cards due now" })}
        />
        <SideRow
          icon="trendingUp"
          iconClass="text-accent"
          value={`${xpToNext} XP`}
          label={t("journey.side.next.milestone", {
            defaultValue: "to level {{n}}",
            n: level.level + 1,
          })}
        />
      </div>
    </Card>
  );
}

/* ── quick actions ── */

function QuickStartCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  return (
    <Card as="section" padding="sm" aria-label={t("journey.side.quick.title", { defaultValue: "Quick start" })}>
      <SideHeader icon="sparkles" title={t("journey.side.quick.title", { defaultValue: "Quick start" })} />
      <div className="mt-3 flex flex-col gap-2">
        <Link
          to={langPath("practice/flashcards/review")}
          className={composeButtonClasses({ variant: "primary", size: "sm", className: "w-full" })}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="refresh" size={14} aria-hidden />
            {t("journey.side.quick.review", { defaultValue: "Review due cards" })}
          </span>
        </Link>
        <Link
          to={langPath("learn")}
          className={composeButtonClasses({ variant: "secondary", size: "sm", className: "w-full" })}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="bookOpen" size={14} aria-hidden />
            {t("journey.side.quick.continue", { defaultValue: "Continue learning" })}
          </span>
        </Link>
      </div>
    </Card>
  );
}

/* ── streak strip ── */

function StreakStripCard({ days, streak }: { days: DayActivity[]; streak: number }) {
  const { t } = useTranslation();
  const week = useMemo(() => lastNDays(days, 7), [days]);

  return (
    <Card as="section" padding="sm" aria-label={t("journey.side.streak.title", { defaultValue: "Streak" })}>
      <div className="flex items-center justify-between gap-2">
        <SideHeader icon="flame" title={t("journey.side.streak.title", { defaultValue: "Streak" })} />
        <span className="text-sm font-bold tabular-nums text-text-primary">
          {t("journey.side.streak.count", { defaultValue: "{{n}} days", n: streak })}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-1">
        {week.map((d) => {
          const hit = d.xpEarned > 0 || d.lessonsCompleted > 0;
          const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span
                className="flex size-7 items-center justify-center rounded-full border"
                style={{
                  backgroundColor: hit ? "rgb(var(--color-accent))" : "transparent",
                  borderColor: hit ? "rgb(var(--color-accent))" : "rgb(var(--color-border-muted))",
                }}
                aria-hidden
              >
                {hit ? <Icon name="flame" size={13} className="text-accent-foreground" /> : null}
              </span>
              <span className="text-[9px] text-text-muted">{"SMTWTFS"[dow]}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── shared bits ── */

function SideHeader({ icon, title }: { icon: IconName; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon name={icon} size={15} aria-hidden />
      </span>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
    </div>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-surface-muted px-2 py-2 text-center">
      <p className="text-lg font-bold tabular-nums leading-none text-text-primary">{value}</p>
      <p className="mt-1 text-[0.65rem] text-text-muted">{label}</p>
    </div>
  );
}

function SideRow({
  icon,
  iconClass,
  value,
  label,
}: {
  icon: IconName;
  iconClass: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={16} className={`shrink-0 ${iconClass}`} aria-hidden />
      <div className="min-w-0">
        <p className="text-base font-bold tabular-nums leading-none text-text-primary">{value}</p>
        <p className="text-[0.7rem] text-text-muted">{label}</p>
      </div>
    </div>
  );
}

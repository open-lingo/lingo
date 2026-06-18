import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, SegmentedControl } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import type { Course } from "@/shared/domain/course";
import { getModuleMastery } from "../moduleMastery";
import { getDerivedDueReviews } from "@/features/lesson/data/derivedReviews";

export type LearnToolsRowProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
};

/**
 * A row of three rich, data-backed cards beneath the main path card on the
 * Learn page. Built only from real progress / SRS / curriculum data — no
 * fabricated stats.
 *
 *   1. Your progress  (All · Practice · Course tabs)
 *   2. Explore the course  (opens the depth modal)
 *   3. Review & practice  (due cards + practice CTAs)
 */
export function LearnToolsRow({ course, completedSet }: LearnToolsRowProps) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProgressCard course={course} completedSet={completedSet} />
      <ExploreCard course={course} />
      <ReviewCard course={course} completedSet={completedSet} />
    </div>
  );
}

/* ── shared bits ── */

function lessonTotals(course: Course, completedSet: ReadonlySet<string>) {
  let total = 0;
  let done = 0;
  for (const mod of course.modules) {
    total += mod.lessons.length;
    done += mod.lessons.filter((l) => completedSet.has(l.id)).length;
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, pct };
}

function CardHeader({ icon, title }: { icon: IconName; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon name={icon} size={16} aria-hidden />
      </span>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={16} className="shrink-0 text-text-muted" aria-hidden />
      <div className="min-w-0">
        <p className="text-base font-bold tabular-nums text-text-primary">
          {value}
        </p>
        <p className="text-[0.7rem] text-text-muted">{label}</p>
      </div>
    </div>
  );
}

/* ── card 1: progress ── */

type ProgressTab = "all" | "practice" | "course";

function ProgressCard({
  course,
  completedSet,
}: {
  course: Course;
  completedSet: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langPath = useLangPath();
  const [tab, setTab] = useState<ProgressTab>("all");

  const { stats } = useUserStats();
  const { count: cardsDue, isLoading: dueLoading } = useCardsDueCount(
    language?.id ?? "",
  );
  const lessons = useMemo(
    () => lessonTotals(course, completedSet),
    [course, completedSet],
  );
  const masteredModules = useMemo(() => {
    let n = 0;
    for (const mod of course.modules) {
      if (mod.comingSoon) continue;
      if (getModuleMastery(mod, completedSet).mastered) n++;
    }
    return n;
  }, [course.modules, completedSet]);
  const moduleCount = course.modules.filter((m) => !m.comingSoon).length;

  return (
    <Card padding="sm" className="flex flex-col">
      <CardHeader
        icon="trendingUp"
        title={t("learn.tools.progress.title", { defaultValue: "Your progress" })}
      />

      <SegmentedControl<ProgressTab>
        value={tab}
        onChange={setTab}
        size="sm"
        fullWidth
        ariaLabel={t("learn.tools.progress.tabsAria", {
          defaultValue: "Progress view",
        })}
        options={[
          {
            value: "all",
            label: t("learn.tools.progress.tabAll", { defaultValue: "All" }),
          },
          {
            value: "practice",
            label: t("learn.tools.progress.tabPractice", {
              defaultValue: "Practice",
            }),
          },
          {
            value: "course",
            label: t("learn.tools.progress.tabCourse", {
              defaultValue: "Course",
            }),
          },
        ]}
      />

      <div className="mt-4 flex-1 space-y-3">
        {tab === "all" ? (
          <>
            <Stat
              icon="target"
              value={`${lessons.pct}%`}
              label={t("learn.tools.progress.completion", {
                defaultValue: "Course complete",
              })}
            />
            <Stat
              icon="zap"
              value={stats.xp.toLocaleString()}
              label={t("learn.tools.progress.xp", { defaultValue: "Total XP" })}
            />
          </>
        ) : null}

        {tab === "practice" ? (
          <>
            <Stat
              icon="refresh"
              value={dueLoading ? "—" : cardsDue}
              label={t("learn.tools.progress.dueNow", {
                defaultValue: "Cards due now",
              })}
            />
            <Stat
              icon="zap"
              value={stats.xp.toLocaleString()}
              label={t("learn.tools.progress.xp", { defaultValue: "Total XP" })}
            />
          </>
        ) : null}

        {tab === "course" ? (
          <>
            <Stat
              icon="bookOpen"
              value={`${lessons.done}/${lessons.total}`}
              label={t("learn.tools.progress.lessons", {
                defaultValue: "Lessons completed",
              })}
            />
            <Stat
              icon="trophy"
              value={`${masteredModules}/${moduleCount}`}
              label={t("learn.tools.progress.modulesMastered", {
                defaultValue: "Modules mastered",
              })}
            />
          </>
        ) : null}
      </div>

      <Link
        to={langPath("practice/journey")}
        className={composeButtonClasses({
          variant: "secondary",
          size: "sm",
          className: "mt-4 w-full",
        })}
      >
        <span className="inline-flex items-center gap-1.5">
          <Icon name="trendingUp" size={14} aria-hidden />
          {t("learn.tools.progress.cta", { defaultValue: "Track my journey" })}
          <Icon name="arrowRight" size={14} aria-hidden />
        </span>
      </Link>
    </Card>
  );
}

/* ── card 2: explore the course ── */

function ExploreCard({ course }: { course: Course }) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const moduleCount = course.modules.filter((m) => !m.comingSoon).length;

  return (
    <Card padding="sm" className="flex flex-col">
      <CardHeader
        icon="compass"
        title={t("learn.tools.explore.title", {
          defaultValue: "Explore the course",
        })}
      />
      <p className="flex-1 text-sm text-text-muted">
        {t("learn.tools.explore.pitch", {
          defaultValue:
            "See everything you'll learn — modules, vocabulary, and concepts.",
        })}
      </p>
      <p className="mt-3 text-xs font-medium text-text-muted">
        {t("learn.tools.explore.moduleCount", {
          defaultValue: "{{count}} modules to discover",
          count: moduleCount,
        })}
      </p>
      <Link
        to={langPath("learn/course")}
        className={composeButtonClasses({
          variant: "secondary",
          size: "sm",
          className: "mt-4 w-full",
        })}
      >
        <span className="inline-flex items-center gap-1.5">
          <Icon name="mapPin" size={14} aria-hidden />
          {t("learn.tools.explore.cta", {
            defaultValue: "Explore the full course",
          })}
        </span>
      </Link>
    </Card>
  );
}

/* ── card 3: review & practice ── */

/** One scannable "what's due" row: icon + count + label, or a muted
 *  placeholder when the data source doesn't exist yet (weak points). */
function ReviewLine({
  icon,
  iconClass,
  value,
  label,
  to,
  placeholder = false,
}: {
  icon: IconName;
  iconClass: string;
  value: string | number;
  label: string;
  to?: string;
  placeholder?: boolean;
}) {
  const body = (
    <>
      <Icon name={icon} size={16} className={`shrink-0 ${iconClass}`} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
        {label}
      </span>
      <span
        className={`shrink-0 text-xs font-bold tabular-nums ${
          placeholder ? "text-text-muted" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </>
  );
  if (to) {
    return (
      <Link
        to={to}
        className="-mx-1 flex items-center gap-2 rounded-md px-1 py-1 transition hover:bg-surface-muted"
      >
        {body}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2 px-1 py-1" aria-hidden={placeholder}>
      {body}
    </div>
  );
}

function ReviewCard({
  course,
  completedSet,
}: {
  course: Course;
  completedSet: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langPath = useLangPath();
  const { count: cardsDue, isLoading } = useCardsDueCount(language?.id ?? "");

  // Module-level reviews due (real FSRS-derived state) — re-derives when
  // completion changes (a finished lesson schedules a first review).
  const moduleReviewsDue = useMemo(() => {
    const rows = getDerivedDueReviews(course);
    return rows.length;
  }, [course, completedSet]);

  const caughtUp = !isLoading && cardsDue === 0 && moduleReviewsDue === 0;

  return (
    <Card padding="sm" className="flex flex-col">
      <CardHeader
        icon="refresh"
        title={t("learn.tools.review.title", {
          defaultValue: "Review & practice",
        })}
      />

      {caughtUp ? (
        <div className="flex flex-1 items-start gap-2.5">
          <Icon
            name="sparkles"
            size={18}
            className="mt-0.5 shrink-0 text-accent"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              {t("learn.tools.review.caughtUpTitle", {
                defaultValue: "All caught up!",
              })}
            </p>
            <p className="text-xs text-text-muted">
              {t("learn.tools.review.caughtUpSub", {
                defaultValue: "No cards due — keep the streak going.",
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-0.5">
          <ReviewLine
            icon="layers"
            iconClass="text-warning"
            value={isLoading ? "—" : cardsDue}
            label={t("learn.tools.review.cardsDueLine", {
              defaultValue: "Flashcards due",
            })}
            to={langPath("practice/flashcards/review")}
          />
          <ReviewLine
            icon="bookOpen"
            iconClass="text-accent"
            value={moduleReviewsDue}
            label={t("learn.tools.review.moduleReviewsLine", {
              defaultValue: "Module reviews",
            })}
            to={
              moduleReviewsDue > 0
                ? langPath("practice/flashcards/review?scope=lessons")
                : undefined
            }
          />
          {/* Weak points has no data source yet — laid out as a disabled
              placeholder so the surface is ready when the analysis ships.
              Intentionally NOT fabricating a count. */}
          <ReviewLine
            icon="target"
            iconClass="text-text-muted"
            value={t("learn.tools.review.soon", { defaultValue: "Soon" })}
            label={t("learn.tools.review.weakPointsLine", {
              defaultValue: "Weak points",
            })}
            placeholder
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {!caughtUp ? (
          <Link
            to={langPath("practice/flashcards/review")}
            className={composeButtonClasses({
              variant: "primary",
              size: "sm",
              className: "w-full",
            })}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="refresh" size={14} aria-hidden />
              {t("learn.tools.review.reviewCta", {
                defaultValue: "Review due cards",
              })}
            </span>
          </Link>
        ) : null}
        <Link
          to={langPath("practice")}
          className={composeButtonClasses({
            variant: caughtUp ? "primary" : "secondary",
            size: "sm",
            className: "w-full",
          })}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="dumbbell" size={14} aria-hidden />
            {t("learn.tools.review.practiceCta", { defaultValue: "Practice" })}
          </span>
        </Link>
      </div>
    </Card>
  );
}

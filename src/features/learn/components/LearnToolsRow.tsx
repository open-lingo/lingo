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
import { CourseDepthModal } from "./CourseDepthModal";

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
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProgressCard course={course} completedSet={completedSet} />
      <ExploreCard course={course} completedSet={completedSet} />
      <ReviewCard />
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
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
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
    <Card padding="md" className="flex flex-col">
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
              icon="flame"
              value={stats.streak}
              label={t("learn.tools.progress.streak", {
                defaultValue: "Day streak",
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
            <Stat
              icon="flame"
              value={stats.streak}
              label={t("learn.tools.progress.streak", {
                defaultValue: "Day streak",
              })}
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
            <Stat
              icon="layers"
              value={moduleCount}
              label={t("learn.tools.progress.modules", {
                defaultValue: "Modules",
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

function ExploreCard({
  course,
  completedSet,
}: {
  course: Course;
  completedSet: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const moduleCount = course.modules.filter((m) => !m.comingSoon).length;

  return (
    <>
      <Card padding="md" className="flex flex-col">
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={composeButtonClasses({
            variant: "secondary",
            size: "sm",
            className: "mt-4 w-full",
          })}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="layers" size={14} aria-hidden />
            {t("learn.tools.explore.cta", {
              defaultValue: "Explore the full course",
            })}
          </span>
        </button>
      </Card>
      <CourseDepthModal
        open={open}
        onClose={() => setOpen(false)}
        course={course}
        completedSet={completedSet}
      />
    </>
  );
}

/* ── card 3: review & practice ── */

function ReviewCard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langPath = useLangPath();
  const { count: cardsDue, isLoading } = useCardsDueCount(language?.id ?? "");
  const caughtUp = !isLoading && cardsDue === 0;

  return (
    <Card padding="md" className="flex flex-col">
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
        <div className="flex flex-1 items-start gap-2.5">
          <Icon
            name="refresh"
            size={18}
            className="mt-0.5 shrink-0 text-warning"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              {isLoading
                ? t("learn.tools.review.checking", {
                    defaultValue: "Checking your reviews…",
                  })
                : t("learn.tools.review.dueTitle", {
                    defaultValue: "{{count}} cards due",
                    count: cardsDue,
                  })}
            </p>
            <p className="text-xs text-text-muted">
              {t("learn.tools.review.dueSub", {
                defaultValue: "Lock in what you've learned.",
              })}
            </p>
          </div>
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

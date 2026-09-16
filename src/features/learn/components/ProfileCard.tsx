import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { ProgressBar } from "@/shared/components/progress/ProgressBar";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Card } from "@/shared/components/ui";
import { cn } from "@/shared/components/ui/cn";
import type { Course } from "@/shared/domain/course";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { xpProgressToNextLevel } from "@/features/progress/leveling";
import { compactStreak } from "../streakDisplay";
import type { LearnProfile } from "../hooks/useLearnProfile";

export type ProfileCardProps = {
  profile: LearnProfile;
  /**
   * Optional course context. When BOTH are given, the level row grows a
   * second line carrying the two numbers that used to live in the
   * `ProgressFloatCard` overlay on the map — course-complete % and total XP
   * (TestFlight #172: three overlays were covering the map's corners, and
   * this was the one whose numbers had a natural home elsewhere). Callers
   * that don't pass them render exactly as before.
   */
  course?: Course;
  completedSet?: ReadonlySet<string>;
  /**
   * Tighter vertical rhythm, for the fixed-height transit-map rail
   * (TestFlight #172). OFF everywhere else — this body also renders in the
   * phone top bar and the classic learn page, and those surfaces are
   * deliberately unchanged.
   */
  dense?: boolean;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card as="section" padding="md" className="h-full shadow-card">
      <ProfileCardBody profile={profile} />
    </Card>
  );
}

/** Lessons completed / lessons total, as a whole percent. */
function coursePercent(course: Course, completedSet: ReadonlySet<string>): number {
  let total = 0;
  let done = 0;
  for (const mod of course.modules) {
    total += mod.lessons.length;
    done += mod.lessons.filter((l) => completedSet.has(l.id)).length;
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/**
 * Chrome-less body of the profile summary (identity + level + XP + stat
 * tiles). Split out so it can be embedded as a section inside the merged
 * "You today" sidebar card without a nested Card border. ProfileCard
 * keeps the standalone Card wrapper for the mobile top bar.
 */
export function ProfileCardBody({
  profile,
  course,
  completedSet,
  dense = false,
}: ProfileCardProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { count: cardsDue, isLoading: cardsDueLoading } = useCardsDueCount(
    language?.id ?? "ko",
  );
  const { stats } = useUserStats();
  const levelProgress = xpProgressToNextLevel(stats.xp);
  const pct =
    course && completedSet ? coursePercent(course, completedSet) : null;

  return (
    <>
      <div className={cn("flex items-center gap-3", dense ? "mb-2" : "mb-3")}>
        <UserAvatar
          name={profile.displayName}
          src={profile.avatarUrl}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-text-primary">
            {profile.isLoading ? "…" : profile.displayName}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-accent">
            <Icon name="trophy" size={12} aria-hidden />
            {t("profile.levelLabel", {
              defaultValue: "Level {{n}}",
              n: levelProgress.level,
            })}
            <span className="font-medium text-text-muted">
              {" · "}
              {levelProgress.intoLevel}/{levelProgress.toNext} XP
            </span>
          </p>
        </div>
      </div>
      {!profile.hasNoProgress ? (
        <ProgressBar
          percent={levelProgress.percent}
          size="xs"
          className={dense ? "mb-1.5" : "mb-3"}
          ariaLabel="XP toward next level"
        />
      ) : null}
      {/* Course progress — the two numbers the map's YOUR PROGRESS overlay
          used to carry (TestFlight #172). One line, right under the XP bar
          they belong next to, with the same "Track my journey" exit the
          overlay had. `pct` is null for every caller that doesn't pass
          course context, so nothing changes off the transit rail. */}
      {pct !== null ? (
        <p
          data-tm="course-progress"
          className={cn(
            "flex flex-wrap items-baseline gap-x-2 text-[0.7rem] text-text-muted",
            dense ? "mb-2" : "mb-3",
          )}
        >
          {/* One short phrase, not the overlay's two stacked stat blocks —
              the rail is 280px wide on an 11" iPad and "8% Course complete /
              405 Total XP / Track my journey" wrapped to three lines there. */}
          <span>
            <span className="font-bold tabular-nums text-text-primary">{pct}%</span>{" "}
            {t("learn.tools.progress.inlineComplete", { defaultValue: "complete" })}
            {" · "}
            <span className="font-bold tabular-nums text-text-primary">
              {stats.xp.toLocaleString()}
            </span>{" "}
            {t("learn.tools.progress.inlineXp", { defaultValue: "XP" })}
          </span>
          <Link
            to={langPath("practice/journey")}
            className="ml-auto inline-flex min-h-[24px] items-center gap-1 font-semibold text-accent hover:text-accent-hover"
          >
            {t("learn.tools.progress.cta", { defaultValue: "Track my journey" })}
            <Icon name="arrowRight" size={11} aria-hidden />
          </Link>
        </p>
      ) : null}
      {profile.hasNoProgress ? (
        <ProfileCardEmpty />
      ) : (
        <div className={cn("grid grid-cols-1 sm:grid-cols-3", dense ? "gap-1" : "gap-1.5")}>
          <StatTile
            iconName="flame"
            valueClassName="text-warning"
            value={compactStreak(profile.streakDays).value}
            unit={compactStreak(profile.streakDays).unit}
            label={t("learn.stats.streak", { defaultValue: "Streak" })}
            hoverTitle={t("learn.stats.streakFull", {
              defaultValue: "{{count}} days",
              count: profile.streakDays,
            })}
          />
          <StatTile
            iconName="star"
            valueClassName="text-accent"
            value={profile.xpEarnedToday}
            label={t("learn.stats.xpToday", { defaultValue: "XP today" })}
          />
          <StatTile
            iconName="layers"
            valueClassName="text-accent"
            value={cardsDueLoading ? "…" : cardsDue}
            label={t("learn.stats.cardsDue", { defaultValue: "Cards due" })}
            to={langPath("practice/flashcards/review")}
          />
        </div>
      )}
    </>
  );
}

/**
 * Empty-state body for fresh accounts (zero completions). Mirrors the
 * spirit of `EmptyActivityNotice` on Home — instead of three "0" tiles
 * that read as dead/broken, give the learner two short forward-looking
 * promises tied to the action that fills them in.
 *
 * Co-located here (vs its own file) because it has zero re-use surface
 * and is purely a visual variant of ProfileCard.
 */
function ProfileCardEmpty() {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
        <Icon name="flame" size={14} className="text-warning" aria-hidden />
        {t("learn.profileEmpty.streakSeed", {
          defaultValue: "Streak starts after lesson 1",
        })}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
        <Icon name="star" size={14} className="text-accent" aria-hidden />
        {t("learn.profileEmpty.xpSeed", {
          defaultValue: "Earn XP by finishing any lesson below",
        })}
      </p>
    </div>
  );
}

function StatTile({
  iconName,
  valueClassName,
  value,
  unit,
  label,
  hoverTitle,
  to,
}: {
  iconName: IconName;
  valueClassName: string;
  value: number | string;
  /** Small suffix letter rendered after the value (e.g. "d" / "m"). */
  unit?: string;
  label: string;
  /** Full-form value shown as a native tooltip on hover (e.g. "34 days"). */
  hoverTitle?: string;
  to?: string;
}) {
  const inner = (
    <>
      <div className="flex items-baseline justify-center gap-1">
        <Icon
          name={iconName}
          size={12}
          className={`self-center ${valueClassName}`}
          aria-hidden
        />
        <span
          className={`text-base font-bold leading-tight tabular-nums ${valueClassName}`}
        >
          {value}
          {unit ? (
            <span className="ml-px text-[0.65rem] font-bold opacity-80">{unit}</span>
          ) : null}
        </span>
      </div>
      <p className="mt-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </>
  );
  const base = "rounded-lg bg-surface-muted px-1.5 py-1.5 text-center";
  if (to) {
    return (
      <Link
        to={to}
        title={hoverTitle}
        className={`${base} transition hover:bg-surface-muted/70 hover:ring-1 hover:ring-accent/30`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className={base} title={hoverTitle}>
      {inner}
    </div>
  );
}

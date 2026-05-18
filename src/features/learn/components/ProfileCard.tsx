import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Card } from "@/shared/components/ui";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import type { LearnProfile } from "../hooks/useLearnProfile";

export type ProfileCardProps = {
  profile: LearnProfile;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { count: cardsDue, isLoading: cardsDueLoading } = useCardsDueCount(
    language?.id ?? "ko",
  );

  return (
    <Card as="section" padding="md" className="h-full shadow-card">
      <div className="mb-3 flex items-center gap-3">
        <UserAvatar
          name={profile.displayName}
          src={profile.avatarUrl}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-text-primary">
            {profile.isLoading ? "…" : profile.displayName}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {profile.levelLabel}
          </p>
        </div>
      </div>
      {profile.hasNoProgress ? (
        <ProfileCardEmpty />
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          <StatTile
            iconName="flame"
            valueClassName="text-warning"
            value={profile.streakDays}
            label={t("progress.dayStreak")}
          />
          <StatTile
            iconName="star"
            valueClassName="text-accent"
            value={profile.xpEarnedToday}
            label={t("progress.xpEarnedToday")}
          />
          <StatTile
            iconName="layers"
            valueClassName="text-accent"
            value={cardsDueLoading ? "…" : cardsDue}
            label={t("progress.cardsDueToday")}
            to={langPath("practice/flashcards/review")}
          />
        </div>
      )}
    </Card>
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
  label,
  to,
}: {
  iconName: IconName;
  valueClassName: string;
  value: number | string;
  label: string;
  to?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-center gap-1">
        <Icon
          name={iconName}
          size={14}
          className={valueClassName}
          aria-hidden
        />
        <span
          className={`text-lg font-extrabold tabular-nums ${valueClassName}`}
        >
          {value}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </>
  );
  const base = "rounded-lg bg-surface-muted px-1.5 py-2 text-center";
  if (to) {
    return (
      <Link
        to={to}
        className={`${base} transition hover:bg-surface-muted/70 hover:ring-1 hover:ring-accent/30`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

import { Icon } from "@/shared/components/Icon";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Card } from "@/shared/components/ui";
import { useTranslation } from "react-i18next";
import type { LearnProfile } from "../hooks/useLearnProfile";

export type ProfileCardProps = {
  profile: LearnProfile;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const { t } = useTranslation();
  return (
    <Card as="section" padding="md" className="shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <UserAvatar
          name={profile.displayName}
          src={profile.avatarUrl}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-text-primary">
            {profile.isLoading ? "…" : profile.displayName}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">{profile.levelLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          iconName="flame"
          iconClassName="text-warning"
          value={profile.streakDays}
          label={t("progress.dayStreak")}
        />
        <StatTile
          iconName="star"
          iconClassName="text-accent"
          value={profile.xpEarnedToday}
          label={t("progress.xpEarnedToday")}
        />
      </div>
    </Card>
  );
}

function StatTile({
  iconName,
  iconClassName,
  value,
  label,
}: {
  iconName: "flame" | "star";
  iconClassName: string;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-surface-muted p-2.5 text-center">
      <div className="flex items-center justify-center gap-1">
        <Icon name={iconName} size={18} className={iconClassName} aria-hidden />
        <span className="text-lg font-bold text-text-primary">{value}</span>
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
    </div>
  );
}

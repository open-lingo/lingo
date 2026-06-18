import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { Avatar } from "@/shared/components/ui/Avatar";
import { UserPreviewPopover } from "@/features/social/components/UserPreviewPopover";
import { cn } from "@/shared/components/ui/cn";
import type { Contributor } from "../hooks/useTopContributors";

export type ContributorCardProps = {
  contributor: Contributor;
  className?: string;
};

/**
 * ContributorCard — a person tile for the Top Contributors rail. Shows the
 * creator's avatar (initials fallback), name, handle, and authored-content
 * stats. The avatar + name open a profile preview popover; the whole card
 * links to the public profile.
 */
export function ContributorCard({ contributor, className }: ContributorCardProps) {
  const { t } = useTranslation();
  const { displayName, username, avatarUrl, contentCount, upvotes } = contributor;

  return (
    <div
      className={cn(
        "flex w-44 shrink-0 snap-start flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center transition hover:border-accent/40 hover:shadow-card",
        className,
      )}
    >
      <UserPreviewPopover username={username} displayName={displayName}>
        <Link to={`/u/${username}`} className="flex flex-col items-center gap-2">
          <Avatar src={avatarUrl} name={displayName} size="lg" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-text-primary">
              {displayName}
            </span>
            <span className="block truncate text-xs text-text-muted">
              @{username}
            </span>
          </span>
        </Link>
      </UserPreviewPopover>

      <dl className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
        <div className="inline-flex items-center gap-1" title={t("community.contributorContentCount", "Published content")}>
          <Icon name="layers" size={13} aria-hidden />
          <span className="tabular-nums">{contentCount}</span>
        </div>
        {upvotes > 0 ? (
          <div className="inline-flex items-center gap-1" title={t("community.contributorUpvotes", "Total upvotes")}>
            <Icon name="chevronUp" size={13} aria-hidden />
            <span className="tabular-nums">{upvotes}</span>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

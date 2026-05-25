/**
 * Activity feed peek — compact horizontal strip of recent friend
 * achievements with one-tap reactions. Lives at the top of the social
 * page as light social glue.
 *
 * Reads from `useActivityFeed` so the eventual `SocialApi` swaps in
 * without component change. Skeleton + empty states are handled here.
 */
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { UserAvatar } from "../components/UserAvatar";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { ReactionRow } from "../components/ReactionRow";
import { useActivityFeed } from "../hooks/useSocial";
import { useReactToActivity } from "../hooks/useSocialMutations";
import type { ActivityItem } from "../mock/mockSocial";

const KIND_ICON: Record<
  ActivityItem["kind"],
  { icon: "flame" | "graduationCap" | "trophy" | "sparkles" | "star"; tone: string }
> = {
  streak: { icon: "flame", tone: "text-warning bg-warning/10" },
  module: { icon: "graduationCap", tone: "text-accent bg-accent-muted" },
  league: { icon: "trophy", tone: "text-warning bg-warning/10" },
  joined: { icon: "sparkles", tone: "text-accent bg-accent-muted" },
  milestone: { icon: "star", tone: "text-success bg-success/10" },
};

export function ActivityFeedStrip() {
  const { t } = useTranslation();
  const { data, isLoading, isEmpty } = useActivityFeed();

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="sparkles" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("social.activity.title", "Friends recently")}
        </h3>
        <button
          type="button"
          className="ml-auto text-[11px] font-medium text-accent hover:text-accent-hover"
        >
          {t("social.activity.seeAll", "See all")}
        </button>
      </div>
      {isLoading ? (
        <ActivitySkeleton />
      ) : isEmpty || !data ? (
        <p className="px-4 py-6 text-center text-xs text-text-muted">
          {t(
            "social.activity.empty",
            "No friend activity yet — add friends to start seeing wins here.",
          )}
        </p>
      ) : (
        <ul className="flex gap-2 overflow-x-auto px-3 py-2.5">
          {data.map((a) => (
            <ActivityCard key={a.id} item={a} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const { t } = useTranslation();
  const kind = KIND_ICON[item.kind];
  const react = useReactToActivity();
  // Backwards-compat: synthesize a wave reaction from kudosCount when no
  // explicit reactions list lives on the item.
  const reactions = item.reactions ?? [{ kind: "wave" as const, count: item.kudosCount }];

  return (
    <li className="flex w-[280px] shrink-0 flex-col gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 py-2">
      <div className="flex items-center gap-2.5">
        <Link to={`/u/${encodeURIComponent(item.user.name)}`} aria-label={item.user.name}>
          <UserAvatar
            name={item.user.name}
            imageUrl={item.user.imageUrl}
            frame={item.user.frame}
            size="sm"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/u/${encodeURIComponent(item.user.name)}`}
              className="min-w-0 hover:underline focus:underline focus:outline-none"
            >
              <UsernameDisplay
                name={item.user.name}
                cosmetic={item.user.cosmetic}
                className="truncate text-xs"
              />
            </Link>
            <span className={`flex h-4 w-4 items-center justify-center rounded ${kind.tone}`}>
              <Icon name={kind.icon} size={9} aria-hidden />
            </span>
            <span className="ml-auto shrink-0 text-[9px] text-text-muted">{item.timeLabel}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-text-secondary">{item.text}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1">
        <ReactionRow
          reactions={reactions}
          disabled={react.isPending}
          onToggle={(k) => react.mutate({ activityId: item.id, kind: k })}
          ariaLabelPrefix={t("social.activity.cheerOn", "Cheer on {{name}}", {
            name: item.user.name,
          })}
        />
      </div>
    </li>
  );
}

function ActivitySkeleton() {
  return (
    <ul className="flex gap-2 overflow-x-auto px-3 py-2.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="flex w-[280px] shrink-0 animate-pulse flex-col gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-2"
        >
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-border" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 w-24 rounded bg-border" />
              <div className="h-2 w-32 rounded bg-border" />
            </div>
          </div>
          <div className="h-5 w-32 rounded-full bg-border" />
        </li>
      ))}
    </ul>
  );
}

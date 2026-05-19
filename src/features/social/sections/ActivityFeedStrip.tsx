/**
 * Activity feed peek — compact horizontal strip of recent friend
 * achievements with one-tap kudos. Lives at the top of the social page as
 * light social glue. Cards are ~80px tall so the strip costs ~110px
 * including the header, keeping the page within one viewport.
 */
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { UserAvatar } from "../components/UserAvatar";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { KudosButton } from "../components/KudosButton";
import { MOCK_ACTIVITY, type ActivityItem } from "../mock/mockSocial";

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
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="sparkles" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Friends recently
        </h3>
        <button
          type="button"
          className="ml-auto text-[11px] font-medium text-accent hover:text-accent-hover"
        >
          See all
        </button>
      </div>
      <ul className="flex gap-2 overflow-x-auto px-3 py-2.5">
        {MOCK_ACTIVITY.map((a) => {
          const kind = KIND_ICON[a.kind];
          return (
            <li
              key={a.id}
              className="flex w-[260px] shrink-0 items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-2.5 py-2"
            >
              <UserAvatar
                name={a.user.name}
                imageUrl={a.user.imageUrl}
                frame={a.user.frame}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <UsernameDisplay
                    name={a.user.name}
                    cosmetic={a.user.cosmetic}
                    className="truncate text-xs"
                  />
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded ${kind.tone}`}
                  >
                    <Icon name={kind.icon} size={9} aria-hidden />
                  </span>
                  <span className="ml-auto shrink-0 text-[9px] text-text-muted">{a.timeLabel}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-text-secondary">{a.text}</p>
              </div>
              <KudosButton initialCount={a.kudosCount} emoji="👋" size="sm" />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

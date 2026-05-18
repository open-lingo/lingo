import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { FriendAvatar } from "./components/FriendAvatar";
import {
  MOCK_FRIENDS,
  MOCK_FRIEND_SUGGESTION,
  MOCK_FRIEND_QUEST,
} from "./mockHomeData";

export function SocialCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const fq = MOCK_FRIEND_QUEST;
  const sug = MOCK_FRIEND_SUGGESTION;

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.social.kicker", { defaultValue: "Social" })}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            {t("home.restructured.social.headline", { defaultValue: "Friends" })}
          </h2>
        </div>
        <button
          type="button"
          // MOCK: wire to friend-invite flow when social backend lands.
          className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
        >
          <Icon name="plus" size={14} aria-hidden />
          {t("home.restructured.social.addCta", { defaultValue: "Add" })}
        </button>
      </div>

      {/* Friend streaks list */}
      <ul className="mt-5 space-y-3">
        {/* MOCK: MOCK_FRIENDS — replace with friends API. */}
        {MOCK_FRIENDS.map((f) => (
          <li key={f.id} className="flex items-center gap-3">
            <FriendAvatar name={f.name} status={f.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{f.name}</p>
              <p className="text-xs text-text-muted">
                {f.status === "active"
                  ? t("home.restructured.social.activeToday", {
                      defaultValue: "Active today",
                    })
                  : t("home.restructured.social.idle", { defaultValue: "Idle" })}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
              <Icon name="flame" size={12} aria-hidden />
              {f.streak}
            </span>
          </li>
        ))}
      </ul>

      {/* Friend quest */}
      <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("home.restructured.social.friendQuestKicker", { defaultValue: "Friend quest" })}
        </p>
        <p className="mt-1 text-sm font-semibold text-text-primary">
          {/* MOCK: friend-quest sync — replace with backend. */}
          {t(fq.labelKey, { defaultValue: fq.labelDefault })}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-text-muted">
              {t("home.restructured.social.youLabel", { defaultValue: "You" })}
            </p>
            <p className="mt-0.5 font-bold text-text-primary">
              {fq.you}/1 {fq.you >= 1 ? "✓" : ""}
            </p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-text-muted">{fq.friendName}</p>
            <p className="mt-0.5 font-bold text-text-primary">
              {fq.friend}/1 {fq.friend >= 1 ? "✓" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Friend suggestion */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("home.restructured.social.suggestionKicker", {
            defaultValue: "Suggested for you",
          })}
        </p>
        {/* MOCK: MOCK_FRIEND_SUGGESTION — replace with friend-suggestion service. */}
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border p-3">
          <FriendAvatar name={sug.name} status="idle" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{sug.name}</p>
            <p className="truncate text-xs text-text-muted">
              {t(sug.reasonKey, { defaultValue: sug.reasonDefault })}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            {t("home.restructured.social.followCta", { defaultValue: "Follow" })}
          </button>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <Link
          to={langPath("community/leaderboard")}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          {t("home.restructured.social.leaderboardCta", { defaultValue: "View leaderboard" })}
          <Icon name="chevronRight" size={16} aria-hidden />
        </Link>
      </div>
    </Card>
  );
}

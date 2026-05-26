import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFriends, useSocial } from "@/features/social/hooks/useSocial";
import { toHomeFriendPreview } from "@/features/social/mock/mockSocial";
import { UserPreviewPopover } from "@/features/social/components/UserPreviewPopover";
import { userSlug } from "@/features/social/userSlug";

export function SocialCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  // Friends comes from the real backend (when VITE_SOCIAL_API is enabled,
  // which is the default). The rest of the card — friend quest + suggestions
  // — still uses the mock bundle until matching backend endpoints land.
  const { friendQuest, primarySuggestion } = useSocial({
    homeFriendsLimit: 3,
  });
  const friendsQuery = useFriends();
  const friends = friendsQuery.data ?? [];
  const homeFriendsPreview = useMemo(
    () =>
      [...friends]
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "active" ? -1 : 1;
          return b.streakDays - a.streakDays;
        })
        .slice(0, 3)
        .map(toHomeFriendPreview),
    [friends],
  );
  const fq = friendQuest;
  const sug = primarySuggestion;

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
        <Link
          to={langPath("social")}
          className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
        >
          <Icon name="plus" size={14} aria-hidden />
          {t("home.restructured.social.addCta", { defaultValue: "Add" })}
        </Link>
      </div>

      {friendsQuery.isLoading ? (
        <ul className="mt-5 space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-border" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-border" />
                <div className="h-2.5 w-16 rounded bg-border" />
              </div>
              <div className="h-5 w-10 rounded-full bg-border" />
            </li>
          ))}
        </ul>
      ) : homeFriendsPreview.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-surface-muted p-4 text-center">
          <p className="text-sm font-medium text-text-primary">
            {t("home.restructured.social.emptyTitle", {
              defaultValue: "No friends yet",
            })}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t("home.restructured.social.emptyDesc", {
              defaultValue: "Add friends to share streaks and quests.",
            })}
          </p>
          <Link
            to={langPath("social")}
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            {t("home.restructured.social.emptyCta", {
              defaultValue: "Find friends",
            })}
            <Icon name="chevronRight" size={12} aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {homeFriendsPreview.map((f) => {
            const slug = userSlug({ username: f.username, name: f.name });
            return (
              <li key={f.id} className="flex items-center gap-3">
                <UserPreviewPopover username={slug} displayName={f.name}>
                  <UserAvatar name={f.name} size="sm" status={f.status} />
                </UserPreviewPopover>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/u/${slug}`}
                    className="truncate text-sm font-medium text-text-primary hover:underline"
                  >
                    {f.name}
                  </Link>
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
            );
          })}
        </ul>
      )}

      <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("home.restructured.social.friendQuestKicker", { defaultValue: "Friend quest" })}
        </p>
        <p className="mt-1 text-sm font-semibold text-text-primary">
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

      {sug ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.social.suggestionKicker", {
              defaultValue: "Suggested for you",
            })}
          </p>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border p-3">
            <UserPreviewPopover
              username={userSlug(sug.user)}
              displayName={sug.user.name}
            >
              <UserAvatar name={sug.user.name} size="sm" status={sug.user.status} />
            </UserPreviewPopover>
            <div className="min-w-0 flex-1">
              <Link
                to={`/u/${userSlug(sug.user)}`}
                className="truncate text-sm font-medium text-text-primary hover:underline"
              >
                {sug.user.name}
              </Link>
              <p className="truncate text-xs text-text-muted">{sug.reason}</p>
            </div>
            <button
              type="button"
              className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              {t("home.restructured.social.followCta", { defaultValue: "Follow" })}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-auto pt-5">
        <Link
          to={langPath("social")}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          {t("home.restructured.social.openSocialCta", { defaultValue: "Open social" })}
          <Icon name="chevronRight" size={16} aria-hidden />
        </Link>
      </div>
    </Card>
  );
}

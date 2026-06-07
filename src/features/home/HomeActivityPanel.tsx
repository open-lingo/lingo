import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { Card } from "@/shared/components/ui";
import { useApi } from "@/shared/api/provider";
import type { CommunityThread } from "@/shared/api/community";

type ActivityRow = {
  id: string;
  iconName: IconName;
  title: string;
  subtitle: string;
  href: string;
  isNew?: boolean;
};

export function HomeActivityPanel() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const flags = useFeatureFlags();
  const { community } = useApi();

  const threadsQuery = useQuery<CommunityThread[]>({
    queryKey: ["community", "threads", "home-activity"],
    queryFn: ({ signal }) =>
      community.listThreads({ sort: "new", limit: 10 }, signal),
    staleTime: 60_000,
    enabled: flags.community.tabs.discuss,
  });

  const rows = useMemo((): ActivityRow[] => {
    const items: ActivityRow[] = [];

    if (flags.community.tabs.discuss) {
      const recent = [...(threadsQuery.data ?? [])]
        .filter((thread) => !thread.isPinned)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 2);

      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();
      for (const thread of recent) {
        items.push({
          id: `thread-${thread.id}`,
          iconName: "fileText",
          title: thread.title,
          subtitle: t("home.activity.forumReplies", { count: thread.replyCount }),
          href: langPath(`community/discuss/thread/${thread.id}`),
          // Why: backend status is open|closed|locked — not a "new" signal.
          // Treat threads created in the last 24h as new instead.
          isNew: now - new Date(thread.createdAt).getTime() < ONE_DAY_MS,
        });
      }
    }

    if (flags.community.tabs.explore) {
      items.push({
        id: "decks-new",
        iconName: "decks",
        title: t("home.activity.newDecksTitle"),
        subtitle: t("home.newDecksThisWeek", { count: 3 }),
        href: langPath("community/explore"),
        isNew: true,
      });
    }

    if (flags.community.tabs.leaderboard) {
      items.push({
        id: "leaderboard",
        iconName: "flame",
        title: t("home.activity.leaderboardTitle"),
        subtitle: t("home.activity.leaderboardSubtitle"),
        href: langPath("community/leaderboard"),
      });
    }

    return items.slice(0, 4);
  }, [flags.community.tabs, langPath, t, threadsQuery.data]);

  if (rows.length === 0) {
    return (
      <Card as="section" padding="md" className="border-dashed">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-muted">
            <Icon name="info" size={20} aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {t("home.activity.title")}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t("home.activity.empty")}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card as="section" padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="m-0 text-base font-semibold text-text-primary sm:text-lg">
          {t("home.activity.title")}
        </h2>
        {flags.community.tabs.discuss ? (
          <Link
            to={langPath("community/discuss")}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
          >
            {t("home.activity.viewForum")}
            <Icon name="chevronRight" size={16} aria-hidden />
          </Link>
        ) : null}
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to={row.href}
              className="group flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted sm:px-5"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-secondary transition group-hover:bg-accent-muted group-hover:text-accent"
                aria-hidden
              >
                <Icon name={row.iconName} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{row.title}</p>
                <p className="mt-0.5 truncate text-xs text-text-secondary">
                  {row.subtitle}
                </p>
              </div>
              {row.isNew ? (
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-accent">
                  {t("home.activity.badgeNew")}
                </span>
              ) : (
                <Icon
                  name="chevronRight"
                  size={18}
                  className="shrink-0 text-text-muted transition group-hover:text-accent"
                  aria-hidden
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-4 py-2.5 text-xs text-text-muted sm:px-5">
        {t("home.activity.footerNote")}
      </p>
    </Card>
  );
}

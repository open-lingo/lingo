import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { MOCK_THREADS } from "@/features/community/forum/mockForum";

type Row = {
  id: string;
  kind: "thread" | "deck" | "article";
  title: string;
  meta: string;
  iconName: IconName;
  href: string;
  isNew?: boolean;
};

export function CommunityStrip() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const flags = useFeatureFlags();

  const rows = useMemo((): Row[] => {
    const items: Row[] = [];

    if (flags.community.tabs.discuss) {
      const recent = [...MOCK_THREADS]
        .filter((thread) => !thread.isPinned)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 1);
      for (const thread of recent) {
        items.push({
          id: `thread-${thread.id}`,
          kind: "thread",
          title: thread.title,
          meta: t("home.restructured.community.threadMeta", {
            defaultValue: "{{count}} replies",
            count: thread.replyCount,
          }),
          iconName: "fileText",
          href: langPath(`community/discuss/thread/${thread.id}`),
          isNew: thread.status === "new",
        });
      }
    }

    if (flags.community.tabs.explore) {
      items.push({
        id: "decks-new",
        kind: "deck",
        title: t("home.restructured.community.newDecksTitle", {
          defaultValue: "New decks this week",
        }),
        meta: t("home.restructured.community.newDecksMeta", {
          defaultValue: "{{count}} added",
          count: 3,
        }),
        iconName: "decks",
        href: langPath("community/explore"),
        isNew: true,
      });
    }

    // Article slot — placeholder until flags.community.tabs.articles exists.
    // MOCK: third row is a static placeholder; wire to articles feed when ready.
    items.push({
      id: "article-placeholder",
      kind: "article",
      title: t("home.restructured.community.articlePlaceholderTitle", {
        defaultValue: "Why は and が aren't the same thing",
      }),
      meta: t("home.restructured.community.articlePlaceholderMeta", {
        defaultValue: "Article · 7 min read",
      }),
      iconName: "newspaper",
      href: langPath("community/explore"),
    });

    return items.slice(0, 3);
  }, [flags.community.tabs, langPath, t]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Icon name="globe" size={18} aria-hidden />
          </span>
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">
            {t("home.restructured.community.headline", { defaultValue: "Community" })}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {flags.community.tabs.discuss ? (
            <Link
              to={langPath("community/discuss")}
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              {t("home.restructured.community.discussionsLink", {
                defaultValue: "Discussions",
              })}
            </Link>
          ) : null}
          {flags.community.tabs.explore ? (
            <Link
              to={langPath("community/explore")}
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              {t("home.restructured.community.browseLink", { defaultValue: "Browse decks" })}
            </Link>
          ) : null}
        </div>
      </div>
      <ul className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to={row.href}
              className="group flex h-full items-start gap-3 px-4 py-3 transition hover:bg-surface-muted"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-secondary transition group-hover:bg-accent-muted group-hover:text-accent">
                <Icon name={row.iconName} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {t(`home.restructured.community.kind.${row.kind}`, {
                      defaultValue: row.kind,
                    })}
                  </span>
                  {row.isNew ? (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-on-accent">
                      {t("home.restructured.community.newBadge", { defaultValue: "New" })}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-semibold leading-snug text-text-primary">{row.title}</p>
                <p className="mt-1 text-xs text-text-muted">{row.meta}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

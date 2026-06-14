import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { useApi } from "@/shared/api/provider";
import type { CommunityThread, CommunityAddon } from "@/shared/api/community";

type Tile = {
  id: string;
  kind: "deck" | "thread";
  title: string;
  meta: string;
  iconName: IconName;
  href: string;
  isNew?: boolean;
};

const TILE_LIMIT = 4;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Trending community — a compact horizontal strip (Steam/Netflix-style) of
 * the freshest decks + discussions. Answers "what's cool in the community?".
 *
 * Real data: community addons (decks) via `listAddons` + recent threads via
 * `listThreads`. Cover-image art isn't on the addon payload yet, so tiles use
 * an icon chip; swap to real covers when the backend ships them.
 */
export function TrendingRow() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const flags = useFeatureFlags();
  const { language } = useLanguage();
  const { community } = useApi();
  const langId = language?.id ?? "ko";

  const decksQuery = useQuery<CommunityAddon[]>({
    queryKey: ["community", "addons", "home-trending", langId],
    queryFn: ({ signal }) =>
      community.listAddons({ languageId: langId, limit: 6 }, signal),
    staleTime: 60_000,
    enabled: flags.community.tabs.explore,
  });

  const threadsQuery = useQuery<CommunityThread[]>({
    queryKey: ["community", "threads", "home-trending"],
    queryFn: ({ signal }) => community.listThreads({ sort: "new", limit: 6 }, signal),
    staleTime: 60_000,
    enabled: flags.community.tabs.discuss,
  });

  const isLoading =
    (flags.community.tabs.explore && decksQuery.isLoading) ||
    (flags.community.tabs.discuss && threadsQuery.isLoading);

  const tiles = useMemo((): Tile[] => {
    const now = Date.now();
    const items: Tile[] = [];

    for (const d of (decksQuery.data ?? []).slice(0, 3)) {
      items.push({
        id: `deck-${d.id}`,
        kind: "deck",
        title: d.name,
        meta:
          d.itemCount != null
            ? t("home.restructured.trending.deckMeta", {
                defaultValue: "{{count}} cards · {{up}} upvotes",
                count: d.itemCount,
                up: d.upvoteCount,
              })
            : t("home.restructured.trending.deckMetaNoCount", {
                defaultValue: "{{up}} upvotes",
                up: d.upvoteCount,
              }),
        iconName: "decks",
        href: langPath("community/explore"),
        isNew: now - new Date(d.createdAt).getTime() < ONE_DAY_MS * 7,
      });
    }

    for (const th of (threadsQuery.data ?? [])
      .filter((x) => !x.isPinned)
      .slice(0, 2)) {
      items.push({
        id: `thread-${th.id}`,
        kind: "thread",
        title: th.title,
        meta: t("home.restructured.trending.threadMeta", {
          defaultValue: "{{count}} replies",
          count: th.replyCount,
        }),
        iconName: "fileText",
        href: langPath(`community/discuss/thread/${th.id}`),
        isNew: now - new Date(th.createdAt).getTime() < ONE_DAY_MS,
      });
    }

    return items.slice(0, TILE_LIMIT);
  }, [decksQuery.data, threadsQuery.data, langPath, t]);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Icon name="globe" size={16} aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-text-primary sm:text-base">
            {t("home.restructured.trending.headline", { defaultValue: "Trending in the community" })}
          </h2>
        </div>
        <Link
          to={langPath("community/explore")}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
        >
          {t("home.restructured.trending.browse", { defaultValue: "Browse all" })}
          <Icon name="chevronRight" size={14} aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <ul className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="bg-surface p-3" aria-hidden>
              <div className="h-9 w-9 animate-pulse rounded-lg bg-border" />
              <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-border" />
              <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-border" />
            </li>
          ))}
        </ul>
      ) : tiles.length === 0 ? (
        <div className="px-4 py-5 text-center text-sm text-text-muted">
          {t("home.restructured.trending.empty", {
            defaultValue: "No community content yet — be the first to publish a deck.",
          })}
        </div>
      ) : (
        <ul className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <Link
                to={tile.href}
                className="group flex h-full flex-col gap-2 p-3 transition hover:bg-surface-muted"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-text-secondary transition group-hover:bg-accent-muted group-hover:text-accent">
                    <Icon name={tile.iconName} size={18} aria-hidden />
                  </span>
                  {tile.isNew ? (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-on-accent">
                      {t("home.restructured.trending.newBadge", { defaultValue: "New" })}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {t(`home.restructured.trending.kind.${tile.kind}`, {
                        defaultValue: tile.kind,
                      })}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                  {tile.title}
                </p>
                <p className="mt-auto truncate text-xs text-text-muted">{tile.meta}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

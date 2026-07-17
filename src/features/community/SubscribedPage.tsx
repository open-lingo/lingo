import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api/provider";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { DeckResponse } from "@/shared/api/decks";
import type { StoryResponse } from "@/shared/api/stories";
import { useBrowseSubscribedContent } from "./useBrowseSubscribedContent";
import { SubscribedRow } from "./components/SubscribedRow";

type TFn = (key: string, defaultValue?: string) => string;

type SortKey = "recent" | "name" | "cards";

const ALL_LANGS = "__all__";
const GROUP_THRESHOLD = 5;

/** Body of the "Subscribed" library tab — rendered inside CommunityLibraryLayout. */
export function SubscribedBody() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { decks: decksApi, users: usersApi, stories: storiesApi } = useApi();
  const flags = useFeatureFlags();
  const explore = flags.community.explore;

  const [subscribedDecks, setSubscribedDecks] = useState<DeckResponse[]>([]);
  const [subscribedStories, setSubscribedStories] = useState<StoryResponse[]>([]);
  // Map deck/story id → subscribedAt ISO string (preserved from subscription stub
  // so we can sort by recency without baking it into the deck/story payloads).
  const [subscribedAt, setSubscribedAt] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [languageFilter, setLanguageFilter] = useState<string>(ALL_LANGS);
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const refresh = useCallback(() => {
    setLoading(true);
    const subTimestamps: Record<string, string> = {};
    Promise.all([
      usersApi
        .getSubscriptions({ contentType: "deck" })
        .then(async (subs) => {
          const results: DeckResponse[] = [];
          for (const s of subs) {
            try {
              const deck = await decksApi.getDeck(s.contentId);
              results.push(deck);
              if (s.createdAt) subTimestamps[deck.id] = s.createdAt;
            } catch {
              /* skip */
            }
          }
          setSubscribedDecks(results);
        })
        .catch(() => setSubscribedDecks([])),
      explore.stories
        ? usersApi
            .getSubscriptions({ contentType: "story" })
            .then(async (subs) => {
              const results: StoryResponse[] = [];
              for (const s of subs) {
                try {
                  const story = await storiesApi.getStory(s.contentId);
                  results.push(story);
                  if (s.createdAt) subTimestamps[story.id] = s.createdAt;
                } catch {
                  /* skip */
                }
              }
              setSubscribedStories(results);
            })
            .catch(() => setSubscribedStories([]))
        : Promise.resolve(setSubscribedStories([])),
    ]).finally(() => {
      setSubscribedAt(subTimestamps);
      setLoading(false);
    });
  }, [decksApi, usersApi, storiesApi, explore.stories]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { subscribeLoading, handleUnsubscribe } = useBrowseSubscribedContent({
    onRefresh: refresh,
  });

  type Row =
    | { kind: "deck"; id: string; languageId: string; name: string; cardCount: number; image?: string | null; subscribedAt: string }
    | { kind: "story"; id: string; languageId: string; name: string; cardCount: number; image?: string | null; subscribedAt: string };

  const allRows = useMemo<Row[]>(() => {
    const deckRows: Row[] = subscribedDecks.map((d) => ({
      kind: "deck",
      id: d.id,
      languageId: d.languageId,
      name: d.name,
      cardCount: d.cardCount,
      image: d.image,
      subscribedAt: subscribedAt[d.id] ?? d.updatedAt ?? d.createdAt ?? "",
    }));
    const storyRows: Row[] = explore.stories
      ? subscribedStories.map((s) => ({
          kind: "story",
          id: s.id,
          languageId: s.languageId,
          name: s.title,
          cardCount: 0,
          image: null,
          subscribedAt: subscribedAt[s.id] ?? s.updatedAt ?? s.createdAt ?? "",
        }))
      : [];
    return [...deckRows, ...storyRows];
  }, [subscribedDecks, subscribedStories, subscribedAt, explore.stories]);

  // Language chips: derived from current subscriptions, not the full available
  // set — the user only cares about languages they actually have content in.
  const languageChips = useMemo(() => {
    const seen = new Map<string, number>();
    for (const r of allRows) {
      seen.set(r.languageId, (seen.get(r.languageId) ?? 0) + 1);
    }
    return Array.from(seen.entries())
      .map(([id, count]) => ({ id, count, cfg: getLanguageConfig(id) }))
      .sort((a, b) => (a.cfg?.name ?? a.id).localeCompare(b.cfg?.name ?? b.id));
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const filtered =
      languageFilter === ALL_LANGS
        ? allRows
        : allRows.filter((r) => r.languageId === languageFilter);

    const sorted = [...filtered];
    if (sortKey === "recent") {
      sorted.sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));
    } else if (sortKey === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === "cards") {
      sorted.sort((a, b) => b.cardCount - a.cardCount);
    }
    return sorted;
  }, [allRows, languageFilter, sortKey]);

  const totalCount = filteredRows.length;

  // Group only when there's enough content to make grouping meaningful AND
  // more than one language is present in the filtered set.
  const distinctLangs = useMemo(
    () => new Set(filteredRows.map((r) => r.languageId)),
    [filteredRows],
  );
  const shouldGroup =
    filteredRows.length > GROUP_THRESHOLD && distinctLangs.size > 1;

  const groupedRows = useMemo(() => {
    if (!shouldGroup) return null;
    const groups = new Map<string, Row[]>();
    for (const r of filteredRows) {
      const arr = groups.get(r.languageId) ?? [];
      arr.push(r);
      groups.set(r.languageId, arr);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const an = getLanguageConfig(a[0])?.name ?? a[0];
      const bn = getLanguageConfig(b[0])?.name ?? b[0];
      return an.localeCompare(bn);
    });
  }, [filteredRows, shouldGroup]);

  const openTo = (r: Row): string => {
    // Decks: no per-deck route exists yet; match CommunityItemCard behavior
    // and send users into the flashcards practice surface for the language.
    // Stories: dedicated route /practice/stories/:id.
    if (r.kind === "deck") return langPath("practice/flashcards");
    return langPath(`practice/stories/${r.id}`);
  };

  const renderRow = (r: Row) => (
    <li key={`${r.kind}:${r.id}`}>
      <SubscribedRow
        t={t as TFn}
        kind={r.kind}
        contentId={r.id}
        title={r.name}
        languageId={r.languageId}
        itemCount={r.kind === "deck" ? r.cardCount : undefined}
        image={r.image}
        openTo={openTo(r)}
        unsubscribeLoading={subscribeLoading === r.id}
        onUnsubscribe={() => handleUnsubscribe(r.kind, r.id)}
      />
    </li>
  );

  return (
    <section className="space-y-5">
        {/* Header */}
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("community.subscribedHeader", "Your subscriptions")}{" "}
            <span className="text-text-muted">({totalCount})</span>
          </h2>
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <span>{t("community.subscribedSortLabel", "Sort")}</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary"
            >
              <option value="recent">
                {t("community.subscribedSortRecent", "Recently subscribed")}
              </option>
              <option value="name">
                {t("community.subscribedSortName", "Name A–Z")}
              </option>
              <option value="cards">
                {t("community.subscribedSortCards", "Most cards")}
              </option>
            </select>
          </label>
        </div>

        {/* Language chip strip */}
        {languageChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip
              active={languageFilter === ALL_LANGS}
              onClick={() => setLanguageFilter(ALL_LANGS)}
              label={t("community.subscribedAllLanguages", "All languages")}
              count={allRows.length}
            />
            {languageChips.map(({ id, count, cfg }) => (
              <Chip
                key={id}
                active={languageFilter === id}
                onClick={() => setLanguageFilter(id)}
                label={`${cfg?.flag ?? "🌐"} ${cfg?.name ?? id}`}
                count={count}
              />
            ))}
          </div>
        )}

        {/* Body */}
        {loading ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
        ) : totalCount === 0 ? (
          <EmptyState
            title={t("community.subscribedEmptyTitle", "No subscriptions yet")}
            description={t(
              "community.subscribedEmptyDescription",
              "Browse community decks to start building a library.",
            )}
            action={
              <Link
                to={langPath("community/browse")}
                className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                {t("community.subscribedEmptyAction", "Browse community decks")}
              </Link>
            }
          />
        ) : shouldGroup && groupedRows ? (
          <div className="space-y-5">
            {groupedRows.map(([langId, rows]) => {
              const cfg = getLanguageConfig(langId);
              return (
                <div key={langId} className="space-y-2">
                  <h3 className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted backdrop-blur">
                    {cfg?.flag ?? "🌐"} {cfg?.name ?? langId}{" "}
                    <span className="font-normal normal-case tracking-normal text-text-muted/70">
                      ({rows.length})
                    </span>
                  </h3>
                  <ul className="space-y-1.5">{rows.map(renderRow)}</ul>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="space-y-1.5">{filteredRows.map(renderRow)}</ul>
        )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary"
      }`}
    >
      <span>{label}</span>
      <span
        className={`tabular-nums ${
          active ? "text-accent-foreground/80" : "text-text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

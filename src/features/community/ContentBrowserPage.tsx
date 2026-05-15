import { useMemo, useState, useEffect, useCallback } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig, LANGUAGE_CONFIGS } from "@/shared/domain/languageConfig";
import { getAllAddons } from "./mockCommunity";
import { getThreadsHot } from "./forum/mockForum";
import { CommunityItemCard, type CommunityItemCardItem } from "./components/CommunityItemCard";
import { useBrowseSubscribedContent } from "./useBrowseSubscribedContent";
import { useCommunityContent } from "./CommunityContentContext";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { TabList, TabButton } from "@/shared/components/ui/Tabs";
import { useApi } from "@/shared/api/provider";
import type { DeckResponse } from "@/shared/api/decks";
import { sortByUpdatedAtDesc } from "@/shared/utils/dateUtils";
import type { StoryResponse } from "@/shared/api/stories";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "./types";

/** Content Browser: courses, flashcard packs, and stories. */
type ContentType = "course" | "flashcard-pack" | "story";

type SortOption = "newest" | "upvotes" | "name";

type DiscoverFilter = "all" | "trending" | "new";

const TRENDING_MIN_UPVOTES = 5;
const NEW_DAYS_CUTOFF = 30;

/** Deck from API mapped to card display shape. */
type DeckCardItem = CommunityAddon & { deckId?: string };

/** Story from API mapped to addon-like shape for ContentCard. */
type StoryCardItem = CommunityAddon & { storyId?: string };

function deckToCardItem(d: DeckResponse): DeckCardItem {
  return {
    id: d.id,
    kind: "flashcard-pack",
    languageId: d.languageId,
    name: d.name,
    description: d.description ?? "",
    maintainerIds: [],
    upvoteCount: 0,
    updatedAt: d.updatedAt ?? d.createdAt ?? "",
    itemCount: d.cardCount,
    deckId: d.id,
    image: d.image,
  };
}

function storyToCardItem(s: StoryResponse): StoryCardItem {
  return {
    id: s.id,
    kind: "story",
    languageId: s.languageId,
    name: s.title,
    description: s.description ?? "",
    maintainerIds: [],
    upvoteCount: 0,
    updatedAt: s.updatedAt ?? s.createdAt ?? "",
    storyId: s.id,
  };
}

function matchesSearch(
  addon: CommunityAddon | DeckCardItem,
  q: string
): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  const lang = getLanguageConfig(addon.languageId);
  const langName = lang?.name ?? addon.languageId;
  return (
    addon.name.toLowerCase().includes(lower) ||
    addon.description.toLowerCase().includes(lower) ||
    langName.toLowerCase().includes(lower)
  );
}

const TYPE_FROM_PARAM: Record<string, ContentType | "all"> = {
  flashcards: "flashcard-pack",
  courses: "course",
  stories: "story",
  all: "all",
};

export function ContentBrowserPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { decks: decksApi, users: usersApi, stories: storiesApi } = useApi();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get("type");

  const [languageFilter, setLanguageFilter] = useState<string | "all" | null>(null);
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [popularOnly, setPopularOnly] = useState(false);
  const [discoverFilter, setDiscoverFilter] = useState<DiscoverFilter>("all");

  useEffect(() => {
    const resolvedType = TYPE_FROM_PARAM[typeParam ?? ""] ?? "all";
    setTypeFilter(resolvedType);
  }, [typeParam]);

  const [apiDecks, setApiDecks] = useState<DeckResponse[]>([]);
  const [apiDecksLoading, setApiDecksLoading] = useState(true);
  const [subscribedDecks, setSubscribedDecks] = useState<
    { deck: DeckResponse; addon: DeckCardItem }[]
  >([]);
  const [subscribedDecksLoading, setSubscribedDecksLoading] = useState(true);
  const [apiStories, setApiStories] = useState<StoryResponse[]>([]);
  const [_apiStoriesLoading, setApiStoriesLoading] = useState(true);
  const [subscribedStories, setSubscribedStories] = useState<
    { story: StoryResponse; addon: StoryCardItem }[]
  >([]);

  const { openDeckPreview, openStoryPreview } = useCommunityContent();

  const langId = language?.id ?? "ko";

  const effectiveLanguage = languageFilter === "all" ? undefined : (languageFilter ?? langId);

  useEffect(() => {
    let ok = true;
    setApiDecksLoading(true);
    decksApi
      .listAdminDecks({ status: "published", language_id: effectiveLanguage })
      .then((decks) => {
        if (ok) setApiDecks(decks);
      })
      .catch(() => {
        if (ok) setApiDecks([]);
      })
      .finally(() => {
        if (ok) setApiDecksLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [decksApi, effectiveLanguage]);

  useEffect(() => {
    let ok = true;
    usersApi
      .getSubscriptions({ contentType: "deck" })
      .then(async (subs) => {
        if (!ok) return;
        setSubscribedDecksLoading(true);
        const results: { deck: DeckResponse; addon: DeckCardItem }[] = [];
        for (const s of subs) {
          try {
            const deck = await decksApi.getDeck(s.contentId);
            if (ok) results.push({ deck, addon: deckToCardItem(deck) });
          } catch {
            /* skip unavailable */
          }
        }
        if (ok) setSubscribedDecks(results);
      })
      .catch(() => {
        if (ok) setSubscribedDecks([]);
      })
      .finally(() => {
        if (ok) setSubscribedDecksLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [usersApi, decksApi]);

  useEffect(() => {
    let ok = true;
    setApiStoriesLoading(true);
    storiesApi
      .listBrowseStories({ language_id: effectiveLanguage })
      .then((list) => {
        if (ok) setApiStories(list);
      })
      .catch(() => {
        if (ok) setApiStories([]);
      })
      .finally(() => {
        if (ok) setApiStoriesLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [storiesApi, effectiveLanguage]);

  useEffect(() => {
    let ok = true;
    usersApi
      .getSubscriptions({ contentType: "story" })
      .then(async (subs) => {
        const results: { story: StoryResponse; addon: StoryCardItem }[] = [];
        for (const s of subs) {
          if (!ok) return;
          try {
            const story = await storiesApi.getStory(s.contentId);
            if (ok) results.push({ story, addon: storyToCardItem(story) });
          } catch {
            /* skip unavailable */
          }
        }
        if (ok) setSubscribedStories(results);
      })
      .catch(() => {
        if (ok) setSubscribedStories([]);
      });
    return () => {
      ok = false;
    };
  }, [usersApi, storiesApi]);

  const refreshSubscriptions = useCallback(() => {
    usersApi
      .getSubscriptions({ contentType: "deck" })
      .then(async (subs) => {
        const results: { deck: DeckResponse; addon: DeckCardItem }[] = [];
        for (const s of subs) {
          try {
            const deck = await decksApi.getDeck(s.contentId);
            results.push({ deck, addon: deckToCardItem(deck) });
          } catch {
            /* skip */
          }
        }
        setSubscribedDecks(results);
      })
      .catch(() => setSubscribedDecks([]));
    usersApi
      .getSubscriptions({ contentType: "story" })
      .then(async (subs) => {
        const results: { story: StoryResponse; addon: StoryCardItem }[] = [];
        for (const s of subs) {
          try {
            const story = await storiesApi.getStory(s.contentId);
            results.push({ story, addon: storyToCardItem(story) });
          } catch {
            /* skip */
          }
        }
        setSubscribedStories(results);
      })
      .catch(() => setSubscribedStories([]));
  }, [usersApi, decksApi, storiesApi]);

  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    subscribeLoading,
    handleSubscribe,
    handleUnsubscribe,
  } = useBrowseSubscribedContent({ onRefresh: refreshSubscriptions });

  const apiDeckCards = useMemo(() => apiDecks.map(deckToCardItem), [apiDecks]);
  const apiStoryCards = useMemo(
    () => apiStories.map(storyToCardItem),
    [apiStories]
  );

  const subscribedIds = useMemo(
    () =>
      new Set([
        ...subscribedDecks.map(({ addon }) => addon.deckId ?? addon.id),
        ...subscribedStories.map(({ addon }) => addon.storyId ?? addon.id),
      ]),
    [subscribedDecks, subscribedStories]
  );

  const mockAddons = useMemo(() => {
    const addons = getAllAddons().filter(
      (a): a is CommunityAddon =>
        a.kind === "course" || a.kind === "story"
    );
    return addons;
  }, []);

  const browseContent = useMemo(() => {
    return [...apiDeckCards, ...apiStoryCards, ...mockAddons];
  }, [apiDeckCards, apiStoryCards, mockAddons]);

  const supportedLanguageIds = useMemo(() => {
    const ids =
      activeTab === "browse"
        ? browseContent.map((a) => a.languageId)
        : [
            ...subscribedDecks.map(({ addon }) => addon.languageId),
            ...subscribedStories.map(({ addon }) => addon.languageId),
          ];
    return Array.from(new Set(ids)).sort();
  }, [activeTab, browseContent, subscribedDecks, subscribedStories]);

  const filteredBrowse = useMemo(() => {
    const now = Date.now();
    const newCutoff = now - NEW_DAYS_CUTOFF * 24 * 60 * 60 * 1000;

    let list = browseContent.filter((a) => {
      if (!matchesSearch(a, search)) return false;
      if (effectiveLanguage && a.languageId !== effectiveLanguage) return false;
      if (typeFilter !== "all" && a.kind !== typeFilter) return false;
      if (popularOnly && (a.upvoteCount ?? 0) < 10) return false;
      if (discoverFilter === "trending" && (a.upvoteCount ?? 0) < TRENDING_MIN_UPVOTES)
        return false;
      if (discoverFilter === "new") {
        const updated = new Date(a.updatedAt).getTime();
        if (updated < newCutoff) return false;
      }
      return true;
    });

    const effectiveSort =
      discoverFilter === "trending" ? "upvotes" : discoverFilter === "new" ? "newest" : sortBy;
    if (effectiveSort === "newest") {
      list = sortByUpdatedAtDesc(list);
    } else if (effectiveSort === "upvotes") {
      list = [...list].sort((a, b) => (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0));
    } else if (effectiveSort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [browseContent, search, effectiveLanguage, typeFilter, popularOnly, sortBy, discoverFilter]);

  const filteredSubscribedDecks = useMemo(() => {
    return subscribedDecks.filter(({ addon }) => {
      if (effectiveLanguage && addon.languageId !== effectiveLanguage) return false;
      if (!matchesSearch(addon, search)) return false;
      return true;
    });
  }, [subscribedDecks, search, effectiveLanguage, langId]);

  const filteredSubscribedStories = useMemo(() => {
    return subscribedStories.filter(({ addon }) => {
      if (effectiveLanguage && addon.languageId !== effectiveLanguage) return false;
      if (!matchesSearch(addon, search)) return false;
      return true;
    });
  }, [subscribedStories, search, effectiveLanguage]);

  const flashcardDecks = useMemo(
    () => filteredBrowse.filter((a) => a.kind === "flashcard-pack"),
    [filteredBrowse]
  );
  const courses = useMemo(
    () => filteredBrowse.filter((a) => a.kind === "course"),
    [filteredBrowse]
  );
  const stories = useMemo(
    () => filteredBrowse.filter((a) => a.kind === "story"),
    [filteredBrowse]
  );

  const apiDecksById = useMemo(
    () => new Map(apiDecks.map((d) => [d.id, d])),
    [apiDecks]
  );
  const apiStoriesById = useMemo(
    () => new Map(apiStories.map((s) => [s.id, s])),
    [apiStories]
  );

  function deckResponseToFlashcardDeck(d: DeckResponse): FlashcardDeck {
    return {
      id: d.id,
      languageId: d.languageId,
      name: d.name,
      cards: d.cards ?? [],
      image: d.image,
      locale: d.locale,
    };
  }

  const showSearchResults = search.trim().length > 0;

  return (
    <div className="space-y-8">
      {!showSearchResults && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
            <Icon name="flame" size={20} className="shrink-0" aria-hidden />
            {t("community.activeDiscussions")}
          </h2>
          <div className="rounded-lg border border-border bg-surface p-4">
            <ul className="space-y-2">
              {getThreadsHot().slice(0, 5).map((thread) => (
                <li key={thread.id}>
                  <Link
                    to={langPath(`community/discuss/thread/${thread.id}`)}
                    className="flex items-center justify-between gap-3 text-sm text-text-primary hover:text-accent"
                  >
                    <span className="truncate">{thread.title}</span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {thread.replyCount} {t("forum.replies")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={langPath("community/discuss")}
              className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
            >
              {t("community.contentBrowserViewAll")} <Icon name="arrowBigRight" size={14} className="inline" />
            </Link>
          </div>
        </section>
      )}

      <TabList>
        <TabButton
          isActive={activeTab === "browse"}
          onClick={() => setActiveTab("browse")}
        >
          {t("community.contentBrowserTabBrowse")}
        </TabButton>
        <TabButton
          isActive={activeTab === "subscribed"}
          onClick={() => setActiveTab("subscribed")}
        >
          {t("community.contentBrowserTabSubscribed")}
        </TabButton>
      </TabList>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Left sidebar: search + filters */}
      <aside className="shrink-0 space-y-4 lg:w-56">
        <div>
          <label htmlFor="content-search" className="sr-only">
            {t("community.contentBrowserSearchPlaceholder")}
          </label>
          <input
            id="content-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("community.contentBrowserSearchPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted"
          />
        </div>

        {activeTab === "browse" && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("forum.type")}
          </h3>
          <div className="flex flex-wrap gap-1">
            {(["all", "flashcard-pack", "course", "story"] as const).map((tipo) => {
              const param = tipo === "all" ? null : tipo === "flashcard-pack" ? "flashcards" : tipo === "course" ? "courses" : "stories";
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tipo);
                    if (param) {
                      navigate(`${langPath("community/explore")}?type=${param}`, { replace: true });
                    } else {
                      navigate(langPath("community/explore"), { replace: true });
                    }
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    typeFilter === tipo
                      ? "bg-accent text-white"
                      : "bg-surface-muted text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  {tipo === "all"
                    ? t("community.browse")
                    : tipo === "flashcard-pack"
                      ? t("community.browseFlashcards")
                      : tipo === "course"
                        ? t("community.browseCourses")
                        : t("community.addonKindStory")}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {(activeTab === "browse" ? browseContent.length > 0 : subscribedDecks.length > 0) && (
        <>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("forum.language")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLanguageFilter("all")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                languageFilter === "all"
                  ? "border-accent bg-accent-muted"
                  : "border-border hover:border-border"
              }`}
              title={t("community.contentBrowserAllLanguages")}
              aria-label={t("community.contentBrowserAllLanguages")}
            >
              🌐
            </button>
            {supportedLanguageIds.map((lId) => {
              const cfg = getLanguageConfig(lId) ?? LANGUAGE_CONFIGS[lId];
              const flag = cfg?.flag ?? "🌐";
              const name = cfg?.name ?? lId;
              const active = (languageFilter ?? langId) === lId;
              return (
                <button
                  key={lId}
                  type="button"
                  onClick={() => setLanguageFilter(lId)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                    active
                      ? "border-accent bg-accent-muted"
                      : "border-border hover:border-border"
                  }`}
                  title={name}
                  aria-label={name}
                >
                  {flag}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "browse" && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("community.contentBrowserDiscover")}
          </h3>
          <div className="flex flex-wrap gap-1">
            {(["all", "trending", "new"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDiscoverFilter(opt)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  discoverFilter === opt
                    ? "bg-accent text-white"
                    : "bg-surface-muted text-text-primary hover:bg-surface-elevated"
                }`}
              >
                {t(`community.contentBrowserDiscover${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
        )}

        {activeTab === "browse" && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("community.contentBrowserSortBy")}
          </h3>
          <div className="flex flex-wrap gap-1">
            {(["newest", "upvotes", "name"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSortBy(opt)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  sortBy === opt
                    ? "bg-accent text-white"
                    : "bg-surface-muted text-text-primary hover:bg-surface-elevated"
                }`}
              >
                {t(`community.contentBrowserSort${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
        )}

        {activeTab === "browse" && (
        <div>
          <label className="mb-2 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={popularOnly}
              onChange={(e) => setPopularOnly(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent bg-surface"
            />
            <span className="text-xs text-text-secondary">
              {t("community.contentBrowserFilterPopular")}
            </span>
          </label>
        </div>
        )}

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setLanguageFilter("all")}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("community.contentBrowserClearLanguage")}
          </button>
          <button
            type="button"
            onClick={() => {
              setLanguageFilter(null);
              setTypeFilter("all");
              setSearch("");
              setPopularOnly(false);
              setSortBy("newest");
              setDiscoverFilter("all");
              if (typeParam) navigate(langPath("community/explore"), { replace: true });
            }}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("community.contentBrowserClearFilters")}
          </button>
        </div>
        </>
        )}
      </aside>

      {/* Main: sections or search results */}
      <main className="min-w-0 flex-1 space-y-8">
        {activeTab === "browse" ? (
          typeFilter !== "all" ? (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                  {typeFilter === "flashcard-pack"
                    ? t("community.contentBrowserFlashcardDecks")
                    : typeFilter === "course"
                      ? t("community.contentBrowserAdditionalCourses")
                      : t("community.contentBrowserStoriesSection")}
                </h2>
                <Link
                  to={langPath("community/explore")}
                  className="text-sm font-medium text-text-secondary hover:underline"
                >
                  <Icon name="arrowBigLeft" size={14} className="mr-1 inline" /> {t("community.contentBrowserViewAll")}
                </Link>
              </div>
              {typeFilter === "flashcard-pack" && apiDecksLoading ? (
                <p className="text-sm text-text-muted">
                  {t("common.loading")}
                </p>
              ) : filteredBrowse.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {t("community.contentBrowserNoResults")}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {filteredBrowse.map((addon) => {
                    if (addon.kind === "flashcard-pack") {
                      const deckId = "deckId" in addon ? addon.deckId ?? addon.id : addon.id;
                      const deck = apiDecksById.get(deckId);
                      return (
                        <li key={addon.id}>
                          <CommunityItemCard
                            item={addon as CommunityItemCardItem}
                            t={t}
                            langPath={langPath}
                            variant="full"
                            showCommunityBadge
                            isSubscribed={subscribedIds.has(deckId)}
                            onSubscribe={() => handleSubscribe("deck", deckId)}
                            onUnsubscribe={() => handleUnsubscribe("deck", deckId)}
                            onPreview={deck ? () => {
                              openDeckPreview(deckResponseToFlashcardDeck(deck), addon, { onSubscriptionChange: refreshSubscriptions });
                            } : undefined}
                            subscribeLoading={subscribeLoading === deckId}
                          />
                        </li>
                      );
                    }
                    if (addon.kind === "story" && "storyId" in addon) {
                      const sid = String((addon as StoryCardItem).storyId ?? addon.id);
                      const story = apiStoriesById.get(sid);
                      return (
                        <li key={addon.id}>
                          <CommunityItemCard
                            item={addon as CommunityItemCardItem}
                            t={t}
                            langPath={langPath}
                            variant="full"
                            showCommunityBadge
                            isSubscribed={subscribedIds.has(sid)}
                            onSubscribe={() => handleSubscribe("story", sid)}
                            onUnsubscribe={() => handleUnsubscribe("story", sid)}
                            onStoryPreview={
                              story
                                ? () => {
                                    openStoryPreview(story, {
                                      onSubscriptionChange: refreshSubscriptions,
                                      isSubscribed: subscribedIds.has(story.id),
                                      onSubscribe: () => handleSubscribe("story", story.id),
                                      onUnsubscribe: () => handleUnsubscribe("story", story.id),
                                      subscribeLoading: subscribeLoading === story.id,
                                    });
                                  }
                                : undefined
                            }
                            subscribeLoading={subscribeLoading === sid}
                          />
                        </li>
                      );
                    }
                    return (
                      <li key={addon.id}>
                        <CommunityItemCard item={addon as CommunityItemCardItem} t={t} langPath={langPath}
                            variant="full"
                            showCommunityBadge />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : showSearchResults ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {t("community.contentBrowserSearchResults")} ({filteredBrowse.length})
              </h2>
              {filteredBrowse.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {t("community.contentBrowserNoResults")}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {filteredBrowse.map((addon) => {
                    if (addon.kind === "flashcard-pack") {
                      const deckId = "deckId" in addon ? addon.deckId ?? addon.id : addon.id;
                      const deck = apiDecksById.get(deckId);
                      return (
                        <li key={addon.id}>
                          <CommunityItemCard
                            item={addon as CommunityItemCardItem}
                            t={t}
                            langPath={langPath}
                            variant="full"
                            showCommunityBadge
                            isSubscribed={subscribedIds.has(deckId)}
                            onSubscribe={() => handleSubscribe("deck", deckId)}
                            onUnsubscribe={() => handleUnsubscribe("deck", deckId)}
                            onPreview={deck ? () => {
                              openDeckPreview(deckResponseToFlashcardDeck(deck), addon, { onSubscriptionChange: refreshSubscriptions });
                            } : undefined}
                            subscribeLoading={subscribeLoading === deckId}
                          />
                        </li>
                      );
                    }
                    if (addon.kind === "story" && "storyId" in addon) {
                      const sid = String((addon as StoryCardItem).storyId ?? addon.id);
                      const story = apiStoriesById.get(sid);
                      return (
                        <li key={addon.id}>
                          <CommunityItemCard
                            item={addon as CommunityItemCardItem}
                            t={t}
                            langPath={langPath}
                            variant="full"
                            showCommunityBadge
                            isSubscribed={subscribedIds.has(sid)}
                            onSubscribe={() => handleSubscribe("story", sid)}
                            onUnsubscribe={() => handleUnsubscribe("story", sid)}
                            onStoryPreview={
                              story ? () => openStoryPreview(story, {
                            onSubscriptionChange: refreshSubscriptions,
                            isSubscribed: subscribedIds.has(story.id),
                            onSubscribe: () => handleSubscribe("story", story.id),
                            onUnsubscribe: () => handleUnsubscribe("story", story.id),
                            subscribeLoading: subscribeLoading === story.id,
                          }) : undefined
                            }
                            subscribeLoading={subscribeLoading === sid}
                          />
                        </li>
                      );
                    }
                    return (
                      <li key={addon.id}>
                        <CommunityItemCard item={addon as CommunityItemCardItem} t={t} langPath={langPath}
                            variant="full"
                            showCommunityBadge />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : (
            <>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("community.contentBrowserFlashcardDecks")}
                  </h2>
                  <Link
                    to={`${langPath("community/explore")}?type=flashcards`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {t("community.contentBrowserSeeMoreFlashcards")} <Icon name="arrowBigRight" size={14} className="inline" />
                  </Link>
                </div>
                {apiDecksLoading ? (
                  <p className="text-sm text-text-muted">
                    {t("common.loading")}
                  </p>
                ) : flashcardDecks.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    {t("community.contentBrowserNoResults")}
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {flashcardDecks.slice(0, 6).map((addon) => {
                      const deckId = "deckId" in addon ? addon.deckId ?? addon.id : addon.id;
                      const deck = apiDecksById.get(deckId);
                      return (
                        <li key={addon.id}>
                          <CommunityItemCard
                            item={addon as CommunityItemCardItem}
                            t={t}
                            langPath={langPath}
                            variant="full"
                            showCommunityBadge
                            isSubscribed={subscribedIds.has(deckId)}
                            onSubscribe={() => handleSubscribe("deck", deckId)}
                            onUnsubscribe={() => handleUnsubscribe("deck", deckId)}
                            onPreview={deck ? () => {
                              openDeckPreview(deckResponseToFlashcardDeck(deck), addon, { onSubscriptionChange: refreshSubscriptions });
                            } : undefined}
                            subscribeLoading={subscribeLoading === deckId}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("community.contentBrowserAdditionalCourses")}
                  </h2>
                  <Link
                    to={`${langPath("community/explore")}?type=courses`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {t("community.contentBrowserSeeMoreCourses")} <Icon name="arrowBigRight" size={14} className="inline" />
                  </Link>
                </div>
                {courses.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    {t("community.contentBrowserNoResults")}
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {courses.slice(0, 6).map((addon) => (
                      <li key={addon.id}>
                        <CommunityItemCard item={addon as CommunityItemCardItem} t={t} langPath={langPath}
                            variant="full"
                            showCommunityBadge />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("community.contentBrowserStoriesSection")}
                  </h2>
                  <Link
                    to={`${langPath("community/explore")}?type=stories`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {t("community.contentBrowserSeeMoreStories")} <Icon name="arrowBigRight" size={14} className="inline" />
                  </Link>
                </div>
                {stories.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    {t("community.contentBrowserNoResults")}
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {stories.slice(0, 6).map((addon) => {
                      if (addon.kind === "story" && "storyId" in addon) {
                        const sid = String((addon as StoryCardItem).storyId ?? addon.id);
                        const story = apiStoriesById.get(sid);
                        return (
                          <li key={addon.id}>
                            <CommunityItemCard
                              item={addon as CommunityItemCardItem}
                              t={t}
                              langPath={langPath}
                            variant="full"
                            showCommunityBadge
                              isSubscribed={subscribedIds.has(sid)}
                              onSubscribe={() => handleSubscribe("story", sid)}
                              onUnsubscribe={() => handleUnsubscribe("story", sid)}
                              onStoryPreview={
                                story ? () => openStoryPreview(story, {
                            onSubscriptionChange: refreshSubscriptions,
                            isSubscribed: subscribedIds.has(story.id),
                            onSubscribe: () => handleSubscribe("story", story.id),
                            onUnsubscribe: () => handleUnsubscribe("story", story.id),
                            subscribeLoading: subscribeLoading === story.id,
                          }) : undefined
                              }
                              subscribeLoading={subscribeLoading === sid}
                            />
                          </li>
                        );
                      }
                      return (
                        <li key={addon.id}>
                          <CommunityItemCard item={addon as CommunityItemCardItem} t={t} langPath={langPath}
                            variant="full"
                            showCommunityBadge />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )
        ) : (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-text-primary">
              {t("community.contentBrowserSubscribed")}
            </h2>
            {subscribedDecksLoading ? (
              <p className="text-sm text-text-muted">
                {t("common.loading")}
              </p>
            ) : filteredSubscribedDecks.length === 0 && filteredSubscribedStories.length === 0 ? (
              <p className="text-sm text-text-muted">
                {t("community.contentBrowserNoResults")}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {filteredSubscribedDecks.map(({ addon, deck }) => (
                  <li key={addon.id}>
                    <CommunityItemCard
                      item={addon as CommunityItemCardItem}
                      t={t}
                      langPath={langPath}
                            variant="full"
                            showCommunityBadge
                      isSubscribed
                      onUnsubscribe={() => handleUnsubscribe("deck", addon.deckId ?? addon.id)}
                      onPreview={() => {
                        openDeckPreview(deckResponseToFlashcardDeck(deck), addon, { onSubscriptionChange: refreshSubscriptions });
                      }}
                      subscribeLoading={subscribeLoading === (addon.deckId ?? addon.id)}
                    />
                  </li>
                ))}
                {filteredSubscribedStories.map(({ addon, story }) => (
                  <li key={addon.id}>
                    <CommunityItemCard
                      item={addon as CommunityItemCardItem}
                      t={t}
                      langPath={langPath}
                            variant="full"
                            showCommunityBadge
                      isSubscribed
                      onUnsubscribe={() => handleUnsubscribe("story", String(addon.storyId ?? addon.id))}
                      onStoryPreview={() => openStoryPreview(story, {
                      onSubscriptionChange: refreshSubscriptions,
                      isSubscribed: subscribedIds.has(story.id),
                      onSubscribe: () => handleSubscribe("story", story.id),
                      onUnsubscribe: () => handleUnsubscribe("story", story.id),
                      subscribeLoading: subscribeLoading === story.id,
                    })}
                      subscribeLoading={subscribeLoading === String(addon.storyId ?? addon.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <Link
          to={langPath("")}
          className="inline-block text-sm text-text-secondary hover:text-text-primary"
        >
          {t("community.backToHome")}
        </Link>
      </main>
      </div>

    </div>
  );
}

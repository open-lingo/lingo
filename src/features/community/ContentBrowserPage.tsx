import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig, LANGUAGE_CONFIGS } from "@/shared/domain/languageConfig";
import { getAllAddons } from "./mockCommunity";
import { getThreadsHot } from "./forum/mockForum";
import { Avatar } from "./components/Avatar";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useApi } from "@/shared/api/provider";
import { DeckPreviewModal } from "@/features/flashcards/DeckPreviewModal";
import type { DeckResponse } from "@/shared/api/decks";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "./types";
import type { AddonKind } from "./types";

const ADDON_KIND_KEYS: Record<AddonKind, string> = {
  course: "community.addonKindCourse",
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  grammar: "community.addonKindGrammar",
};

/** Content Browser: courses, flashcard packs, and stories. */
type ContentType = "course" | "flashcard-pack" | "story";

type SortOption = "newest" | "upvotes" | "name";

type DiscoverFilter = "all" | "trending" | "new";

const TRENDING_MIN_UPVOTES = 5;
const NEW_DAYS_CUTOFF = 30;

/** Deck from API mapped to card display shape. */
type DeckCardItem = CommunityAddon & { deckId?: string };

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

function ContentCard({
  addon,
  t,
  langPath,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
  onPreview,
  subscribeLoading,
}: {
  addon: CommunityAddon | DeckCardItem;
  t: (k: string) => string;
  langPath: (p: string) => string;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  onPreview?: () => void;
  subscribeLoading?: boolean;
}) {
  const lang = getLanguageConfig(addon.languageId);
  const langName = lang?.name ?? addon.languageId;
  const flag = lang?.flag ?? "🌐";
  const deckId = "deckId" in addon ? addon.deckId ?? addon.id : undefined;
  const isDeck = addon.kind === "flashcard-pack";
  const showSubscribe = deckId && isSubscribed !== undefined;

  return (
    <div
      key={addon.id}
      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <span className="text-2xl" role="img" aria-label={langName}>
        {flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">
            {addon.name}
          </span>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {t("community.communityPackBadge")}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {t(ADDON_KIND_KEYS[addon.kind])}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {addon.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {addon.itemCount ?? "—"} {t("community.addonsItems")}
          </span>
          <span>↑ {addon.upvoteCount}</span>
          {addon.discussionCount != null && addon.discussionCount > 0 && (
            <span>
              💬 {addon.discussionCount} {t("community.discussions")}
            </span>
          )}
        </div>
        {addon.maintainerName && (
          <div className="mt-2 flex items-center gap-1.5">
            <Avatar name={addon.maintainerName} size="xs" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {addon.maintainerName}
            </span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
            aria-label="Upvote"
          >
            ↑
          </button>
          {showSubscribe && (
            <button
              type="button"
              disabled={subscribeLoading}
              onClick={isSubscribed ? onUnsubscribe : onSubscribe}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                isSubscribed
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
              }`}
            >
              {subscribeLoading ? "…" : isSubscribed ? t("community.contentBrowserSubscribed") : t("community.contentBrowserSubscribe")}
            </button>
          )}
          {isDeck && onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {t("community.contentBrowserPreview")}
            </button>
          )}
          {isDeck && isSubscribed ? (
            <Link
              to={langPath("practice/flashcards")}
              className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              {t("community.contentBrowserOpen")}
            </Link>
          ) : !isDeck && (
            <Link
              to={addon.kind === "story" ? langPath("practice/stories") : langPath("practice/flashcards")}
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {t("community.contentBrowserOpen")}
            </Link>
          )}
        </div>
      </div>
    </div>
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
  const { decks: decksApi, users: usersApi } = useApi();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get("type");

  const [activeTab, setActiveTab] = useState<"browse" | "subscribed">("browse");
  const [search, setSearch] = useState("");
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
  const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);
  const [previewDeck, setPreviewDeck] = useState<FlashcardDeck | null>(null);
  const [previewAddon, setPreviewAddon] = useState<DeckCardItem | null>(null);

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
  }, [usersApi, decksApi]);


  const apiDeckCards = useMemo(() => apiDecks.map(deckToCardItem), [apiDecks]);

  const subscribedIds = useMemo(
    () => new Set(subscribedDecks.map(({ addon }) => addon.deckId ?? addon.id)),
    [subscribedDecks]
  );

  const mockAddons = useMemo(() => {
    const addons = getAllAddons().filter(
      (a): a is CommunityAddon =>
        a.kind === "course" || a.kind === "story"
    );
    return addons;
  }, []);

  const browseContent = useMemo(() => {
    return [...apiDeckCards, ...mockAddons];
  }, [apiDeckCards, mockAddons]);

  const supportedLanguageIds = useMemo(() => {
    const ids = activeTab === "browse"
      ? browseContent.map((a) => a.languageId)
      : subscribedDecks.map(({ addon }) => addon.languageId);
    return Array.from(new Set(ids)).sort();
  }, [activeTab, browseContent, subscribedDecks]);

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
      list = [...list].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } else if (effectiveSort === "upvotes") {
      list = [...list].sort((a, b) => (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0));
    } else if (effectiveSort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [browseContent, search, effectiveLanguage, typeFilter, popularOnly, sortBy, discoverFilter]);

  const filteredSubscribed = useMemo(() => {
    return subscribedDecks.filter(({ addon }) => {
      if (effectiveLanguage && addon.languageId !== effectiveLanguage) return false;
      if (!matchesSearch(addon, search)) return false;
      return true;
    });
  }, [subscribedDecks, search, effectiveLanguage, langId]);

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

  const handleSubscribe = (deckId: string) => {
    setSubscribeLoading(deckId);
    usersApi
      .addSubscription({ contentType: "deck", contentId: deckId })
      .then(() => refreshSubscriptions())
      .finally(() => setSubscribeLoading(null));
  };

  const handleUnsubscribe = (deckId: string) => {
    setSubscribeLoading(deckId);
    usersApi
      .removeSubscription("deck", deckId)
      .then(() => refreshSubscriptions())
      .finally(() => setSubscribeLoading(null));
  };

  const showSearchResults = search.trim().length > 0;

  return (
    <div className="space-y-8">
      {!showSearchResults && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <span aria-hidden>🔥</span>
            {t("community.activeDiscussions")}
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <ul className="space-y-2">
              {getThreadsHot().slice(0, 5).map((thread) => (
                <li key={thread.id}>
                  <Link
                    to={langPath(`community/discuss/thread/${thread.id}`)}
                    className="flex items-center justify-between gap-3 text-sm text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                  >
                    <span className="truncate">{thread.title}</span>
                    <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {thread.replyCount} {t("forum.replies")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={langPath("community/discuss")}
              className="mt-2 inline-block text-xs font-medium text-green-600 hover:underline dark:text-green-400"
            >
              {t("community.contentBrowserViewAll")} →
            </Link>
          </div>
        </section>
      )}

      {/* Tabs: Browse | Subscribed */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("browse")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "browse"
              ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
              : "-mb-px border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {t("community.contentBrowserTabBrowse")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subscribed")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "subscribed"
              ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
              : "-mb-px border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {t("community.contentBrowserTabSubscribed")}
        </button>
      </div>

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
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>

        {activeTab === "browse" && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                      ? "bg-green-600 text-white dark:bg-green-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("forum.language")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLanguageFilter("all")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                languageFilter === "all"
                  ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
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
                      ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
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
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                    ? "bg-green-600 text-white dark:bg-green-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                    ? "bg-green-600 text-white dark:bg-green-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
              className="rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t("community.contentBrowserFilterPopular")}
            </span>
          </label>
        </div>
        )}

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setLanguageFilter("all")}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
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
            className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {typeFilter === "flashcard-pack"
                    ? t("community.contentBrowserFlashcardDecks")
                    : typeFilter === "course"
                      ? t("community.contentBrowserAdditionalCourses")
                      : t("community.contentBrowserStoriesSection")}
                </h2>
                <Link
                  to={langPath("community/explore")}
                  className="text-sm font-medium text-gray-600 hover:underline dark:text-gray-400"
                >
                  ← {t("community.contentBrowserViewAll")}
                </Link>
              </div>
              {typeFilter === "flashcard-pack" && apiDecksLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("common.loading")}
                </p>
              ) : filteredBrowse.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                          <ContentCard
                            addon={addon}
                            t={t}
                            langPath={langPath}
                            isSubscribed={subscribedIds.has(deckId)}
                            onSubscribe={() => handleSubscribe(deckId)}
                            onUnsubscribe={() => handleUnsubscribe(deckId)}
                            onPreview={deck ? () => {
                              setPreviewDeck(deckResponseToFlashcardDeck(deck));
                              setPreviewAddon(addon);
                            } : undefined}
                            subscribeLoading={subscribeLoading === deckId}
                          />
                        </li>
                      );
                    }
                    return (
                      <li key={addon.id}>
                        <ContentCard addon={addon} t={t} langPath={langPath} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : showSearchResults ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {t("community.contentBrowserSearchResults")} ({filteredBrowse.length})
              </h2>
              {filteredBrowse.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                          <ContentCard
                            addon={addon}
                            t={t}
                            langPath={langPath}
                            isSubscribed={subscribedIds.has(deckId)}
                            onSubscribe={() => handleSubscribe(deckId)}
                            onUnsubscribe={() => handleUnsubscribe(deckId)}
                            onPreview={deck ? () => {
                              setPreviewDeck(deckResponseToFlashcardDeck(deck));
                              setPreviewAddon(addon);
                            } : undefined}
                            subscribeLoading={subscribeLoading === deckId}
                          />
                        </li>
                      );
                    }
                    return (
                      <li key={addon.id}>
                        <ContentCard addon={addon} t={t} langPath={langPath} />
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
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("community.contentBrowserFlashcardDecks")}
                  </h2>
                  <Link
                    to={`${langPath("community/explore")}?type=flashcards`}
                    className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
                  >
                    {t("community.contentBrowserSeeMoreFlashcards")} →
                  </Link>
                </div>
                {apiDecksLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("common.loading")}
                  </p>
                ) : flashcardDecks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("community.contentBrowserNoResults")}
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {flashcardDecks.slice(0, 6).map((addon) => {
                      const deckId = "deckId" in addon ? addon.deckId ?? addon.id : addon.id;
                      const deck = apiDecksById.get(deckId);
                      return (
                        <li key={addon.id}>
                          <ContentCard
                            addon={addon}
                            t={t}
                            langPath={langPath}
                            isSubscribed={subscribedIds.has(deckId)}
                            onSubscribe={() => handleSubscribe(deckId)}
                            onUnsubscribe={() => handleUnsubscribe(deckId)}
                            onPreview={deck ? () => {
                              setPreviewDeck(deckResponseToFlashcardDeck(deck));
                              setPreviewAddon(addon);
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
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("community.contentBrowserAdditionalCourses")}
                  </h2>
                  <Link
                    to={`${langPath("community/explore")}?type=courses`}
                    className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
                  >
                    {t("community.contentBrowserSeeMoreCourses")} →
                  </Link>
                </div>
                {courses.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("community.contentBrowserNoResults")}
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {courses.slice(0, 6).map((addon) => (
                      <li key={addon.id}>
                        <ContentCard addon={addon} t={t} langPath={langPath} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("community.contentBrowserStoriesSection")}
                  </h2>
                  <Link
                    to={`${langPath("community/explore")}?type=stories`}
                    className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
                  >
                    {t("community.contentBrowserSeeMoreStories")} →
                  </Link>
                </div>
                {stories.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("community.contentBrowserNoResults")}
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {stories.slice(0, 6).map((addon) => (
                      <li key={addon.id}>
                        <ContentCard addon={addon} t={t} langPath={langPath} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )
        ) : (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("community.contentBrowserFlashcardDecks")}
            </h2>
            {subscribedDecksLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("common.loading")}
              </p>
            ) : filteredSubscribed.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("community.contentBrowserNoResults")}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {filteredSubscribed.map(({ addon, deck }) => (
                  <li key={addon.id}>
                    <ContentCard
                      addon={addon}
                      t={t}
                      langPath={langPath}
                      isSubscribed
                      onUnsubscribe={() => handleUnsubscribe(addon.deckId ?? addon.id)}
                      onPreview={() => {
                        setPreviewDeck(deckResponseToFlashcardDeck(deck));
                        setPreviewAddon(addon);
                      }}
                      subscribeLoading={subscribeLoading === (addon.deckId ?? addon.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <Link
          to={langPath("")}
          className="inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("community.backToHome")}
        </Link>
      </main>
      </div>

      {(previewDeck ?? previewAddon) && (
        <DeckPreviewModal
          deck={previewDeck}
          addon={previewAddon}
          onClose={() => {
            setPreviewDeck(null);
            setPreviewAddon(null);
          }}
          onSubscriptionChange={refreshSubscriptions}
        />
      )}
    </div>
  );
}

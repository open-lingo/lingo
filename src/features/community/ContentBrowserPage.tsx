import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  getLanguageConfig,
  LANGUAGE_CONFIGS,
  AVAILABLE_LEARNING_LANGUAGE_IDS,
} from "@/shared/domain/languageConfig";
import { getAllAddons } from "./mockCommunity";
import {
  CommunityContentTable,
  type CommunityContentRow,
} from "./components/CommunityContentTable";
import { CommunityItemCard } from "./components/CommunityItemCard";
import { Icon } from "@/shared/components/Icon";
import {
  CommunitySelectedChips,
  type ChipDescriptor,
} from "./components/CommunitySelectedChips";
import { CommunityDecksLayout } from "./CommunityDecksLayout";
import { useBrowseSubscribedContent } from "./useBrowseSubscribedContent";
import { useCommunityContent } from "./CommunityContentContext";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { FacetSidebar, type Facet } from "@/shared/components/ui/FacetSidebar";
import { useApi } from "@/shared/api/provider";
import type { DeckResponse } from "@/shared/api/decks";
import { sortByUpdatedAtDesc } from "@/shared/utils/dateUtils";
import type { StoryResponse } from "@/shared/api/stories";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "./types";

/** Content Browser: courses, flashcard packs, and stories. */
type ContentType = "course" | "flashcard-pack" | "story";

type SortOption = "newest" | "trending" | "upvotes" | "name";

const TRENDING_MIN_UPVOTES = 5;

const FACET_TYPE = "type";
const FACET_LANGUAGE = "language";
const FACET_LEVEL = "level";
const FACET_OTHER = "other";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
const OTHER_OPTIONS = [
  { value: "verified", label: "Verified" },
  { value: "maintained", label: "Maintained" },
];

type DeckCardItem = CommunityAddon & { deckId?: string };
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
  q: string,
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
  const flags = useFeatureFlags();
  const explore = flags.community.explore;
  const { decks: decksApi, users: usersApi, stories: storiesApi } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get("type");
  // Trending-tag pivot — populated by chips in the right rail or by
  // featured-strip clicks. Drives the same matchesSearch substring path
  // (tags aren't a structured field yet — see types.ts).
  const tagParam = searchParams.get("tag");
  // Optional language preselect for the featured-strip cards when no
  // matching tag exists.
  const langParam = searchParams.get("lang");

  const [languageFilter, setLanguageFilter] = useState<string | "all" | null>(
    () => (langParam ? langParam : null),
  );
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [levelFilters, setLevelFilters] = useState<Set<string>>(new Set());
  const [otherFilters, setOtherFilters] = useState<Set<string>>(new Set());

  // Sync language filter when ?lang= changes from outside (back/forward nav).
  useEffect(() => {
    if (langParam) {
      setLanguageFilter(langParam);
    }
  }, [langParam]);

  useEffect(() => {
    let resolvedType = TYPE_FROM_PARAM[typeParam ?? ""] ?? "all";
    if (resolvedType === "story" && !explore.stories) resolvedType = "all";
    if (resolvedType === "course" && !explore.courses) resolvedType = "all";
    if (resolvedType === "flashcard-pack" && !explore.flashcardDecks) resolvedType = "all";
    if (
      typeParam &&
      resolvedType === "all" &&
      typeParam !== "all" &&
      TYPE_FROM_PARAM[typeParam] !== undefined
    ) {
      navigate(langPath("community/explore"), { replace: true });
    }
    setTypeFilter(resolvedType);
  }, [typeParam, explore.stories, explore.courses, explore.flashcardDecks, navigate, langPath]);

  const [apiDecks, setApiDecks] = useState<DeckResponse[]>([]);
  const [apiDecksLoading, setApiDecksLoading] = useState(true);
  const [subscribedDecks, setSubscribedDecks] = useState<DeckResponse[]>([]);
  const [apiStories, setApiStories] = useState<StoryResponse[]>([]);
  const [_apiStoriesLoading, setApiStoriesLoading] = useState(true);
  const [subscribedStories, setSubscribedStories] = useState<StoryResponse[]>([]);

  const { openDeckPreview, openStoryPreview } = useCommunityContent();

  const langId = language?.id ?? "ko";
  // Default: no language filter (all languages). The learner's current language
  // gets a "Suggested" star in the facet list but is NOT auto-applied.
  const effectiveLanguage =
    languageFilter && languageFilter !== "all" ? languageFilter : undefined;

  useEffect(() => {
    if (!explore.flashcardDecks) {
      setApiDecks([]);
      setApiDecksLoading(false);
      return;
    }
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
  }, [decksApi, effectiveLanguage, explore.flashcardDecks]);

  // Subscribed sets — used to mark cards as subscribed in the browse grid.
  const refreshSubscribedSets = useCallback(() => {
    usersApi
      .getSubscriptions({ contentType: "deck" })
      .then(async (subs) => {
        const results: DeckResponse[] = [];
        for (const s of subs) {
          try {
            const deck = await decksApi.getDeck(s.contentId);
            results.push(deck);
          } catch {
            /* skip */
          }
        }
        setSubscribedDecks(results);
      })
      .catch(() => setSubscribedDecks([]));
    if (!explore.stories) {
      setSubscribedStories([]);
      return;
    }
    usersApi
      .getSubscriptions({ contentType: "story" })
      .then(async (subs) => {
        const results: StoryResponse[] = [];
        for (const s of subs) {
          try {
            const story = await storiesApi.getStory(s.contentId);
            results.push(story);
          } catch {
            /* skip */
          }
        }
        setSubscribedStories(results);
      })
      .catch(() => setSubscribedStories([]));
  }, [usersApi, decksApi, storiesApi, explore.stories]);

  useEffect(() => {
    refreshSubscribedSets();
  }, [refreshSubscribedSets]);

  useEffect(() => {
    if (!explore.stories) {
      setApiStories([]);
      setApiStoriesLoading(false);
      return;
    }
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
  }, [storiesApi, effectiveLanguage, explore.stories]);

  const { search, setSearch, subscribeLoading, handleSubscribe, handleUnsubscribe } =
    useBrowseSubscribedContent({ onRefresh: refreshSubscribedSets });

  const apiDeckCards = useMemo(() => apiDecks.map(deckToCardItem), [apiDecks]);
  const apiStoryCards = useMemo(() => apiStories.map(storyToCardItem), [apiStories]);

  const subscribedIds = useMemo(
    () =>
      new Set([
        ...subscribedDecks.map((d) => d.id),
        ...subscribedStories.map((s) => s.id),
      ]),
    [subscribedDecks, subscribedStories],
  );

  const mockAddons = useMemo(() => {
    const addons = getAllAddons().filter(
      (a): a is CommunityAddon => a.kind === "course" || a.kind === "story",
    );
    return addons.filter((a) => {
      if (a.kind === "course" && !explore.courses) return false;
      if (a.kind === "story" && !explore.stories) return false;
      return true;
    });
  }, [explore.courses, explore.stories]);

  const browseContent = useMemo(() => {
    const parts: (DeckCardItem | StoryCardItem | CommunityAddon)[] = [];
    if (explore.flashcardDecks) parts.push(...apiDeckCards);
    if (explore.stories) parts.push(...apiStoryCards);
    parts.push(...mockAddons);
    return parts;
  }, [apiDeckCards, apiStoryCards, mockAddons, explore.flashcardDecks, explore.stories]);

  const facetLanguageIds = useMemo(() => {
    const fromContent = new Set(browseContent.map((a) => a.languageId));
    return Array.from(
      new Set<string>([...AVAILABLE_LEARNING_LANGUAGE_IDS, ...fromContent]),
    ).sort();
  }, [browseContent]);

  const filteredBrowse = useMemo(() => {
    const tagToken = tagParam?.trim().toLowerCase() ?? "";
    let list = browseContent.filter((a) => {
      if (!matchesSearch(a, search)) return false;
      if (effectiveLanguage && a.languageId !== effectiveLanguage) return false;
      if (typeFilter !== "all" && a.kind !== typeFilter) return false;
      // Tags are not yet a first-class field on decks/addons — match the
      // canonicalised tag against name + description as a substring.
      if (tagToken) {
        const hay = `${a.name} ${a.description}`.toLowerCase();
        const probe = tagToken.replace(/-/g, " ");
        if (!hay.includes(tagToken) && !hay.includes(probe)) return false;
      }
      // "Trending" sort applies a minimum-upvotes floor.
      if (sortBy === "trending" && (a.upvoteCount ?? 0) < TRENDING_MIN_UPVOTES)
        return false;
      return true;
    });

    if (sortBy === "newest") {
      list = sortByUpdatedAtDesc(list);
    } else if (sortBy === "trending" || sortBy === "upvotes") {
      list = [...list].sort((a, b) => (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0));
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [browseContent, search, effectiveLanguage, typeFilter, sortBy, tagParam]);

  const apiDecksById = useMemo(() => new Map(apiDecks.map((d) => [d.id, d])), [apiDecks]);
  const apiStoriesById = useMemo(
    () => new Map(apiStories.map((s) => [s.id, s])),
    [apiStories],
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

  const browseCount = filteredBrowse.length;

  const typeFacetOptions = useMemo(() => {
    const opts = [];
    if (explore.flashcardDecks) {
      opts.push({
        value: "flashcard-pack",
        label: t("community.browseFlashcards"),
      });
    }
    if (explore.courses) {
      opts.push({ value: "course", label: t("community.browseCourses") });
    }
    if (explore.stories) {
      opts.push({ value: "story", label: t("community.addonKindStory") });
    }
    return opts;
  }, [explore.courses, explore.stories, explore.flashcardDecks, t]);

  const languageFacetOptions = useMemo(() => {
    const suggestedLabel = t("community.contentBrowserLanguageSuggested", "Suggested");
    return facetLanguageIds.map((lId) => {
      const cfg = getLanguageConfig(lId) ?? LANGUAGE_CONFIGS[lId];
      const isSuggested = lId === langId;
      const base = `${cfg?.flag ?? "🌐"}  ${cfg?.name ?? lId}`;
      return {
        value: lId,
        label: isSuggested ? `${base}  ★ ${suggestedLabel}` : base,
      };
    });
  }, [facetLanguageIds, langId, t]);

  const facets: Facet[] = useMemo(() => {
    const out: Facet[] = [];
    if (typeFacetOptions.length > 0) {
      out.push({
        id: FACET_TYPE,
        label: t("community.contentBrowserFacetType"),
        options: typeFacetOptions,
        multiSelect: false,
      });
    }
    out.push({
      id: FACET_LANGUAGE,
      label: t("community.contentBrowserFacetLanguage"),
      options: languageFacetOptions,
      multiSelect: false,
    });
    out.push({
      id: FACET_LEVEL,
      label: t("community.contentBrowserFacetLevel", "Level"),
      options: LEVEL_OPTIONS,
      multiSelect: true,
    });
    out.push({
      id: FACET_OTHER,
      label: t("community.contentBrowserFacetOther", "Other"),
      options: OTHER_OPTIONS,
      multiSelect: true,
    });
    return out;
  }, [typeFacetOptions, languageFacetOptions, t]);

  const selections: Record<string, string[]> = useMemo(() => {
    const out: Record<string, string[]> = {};
    if (typeFilter !== "all") out[FACET_TYPE] = [typeFilter];
    if (languageFilter && languageFilter !== "all")
      out[FACET_LANGUAGE] = [languageFilter];
    if (levelFilters.size > 0) out[FACET_LEVEL] = Array.from(levelFilters);
    if (otherFilters.size > 0) out[FACET_OTHER] = Array.from(otherFilters);
    return out;
  }, [typeFilter, languageFilter, levelFilters, otherFilters]);

  const handleFacetToggle = useCallback(
    (facetId: string, value: string) => {
      if (facetId === "tag") {
        // Chips reuse the toggle callback as their remove handler.
        clearTag();
        return;
      }
      if (facetId === FACET_TYPE) {
        const next = typeFilter === value ? "all" : (value as ContentType);
        setTypeFilter(next);
        const paramKey =
          next === "flashcard-pack"
            ? "flashcards"
            : next === "course"
              ? "courses"
              : next === "story"
                ? "stories"
                : null;
        if (paramKey) {
          navigate(`${langPath("community/explore")}?type=${paramKey}`, {
            replace: true,
          });
        } else {
          navigate(langPath("community/explore"), { replace: true });
        }
      } else if (facetId === FACET_LANGUAGE) {
        setLanguageFilter((prev) => (prev === value ? null : value));
      } else if (facetId === FACET_LEVEL) {
        setLevelFilters((prev) => {
          const next = new Set(prev);
          if (next.has(value)) next.delete(value);
          else next.add(value);
          return next;
        });
      } else if (facetId === FACET_OTHER) {
        setOtherFilters((prev) => {
          const next = new Set(prev);
          if (next.has(value)) next.delete(value);
          else next.add(value);
          return next;
        });
      }
    },
    [typeFilter, navigate, langPath],
  );

  const handleClearFacet = useCallback(
    (facetId: string) => {
      if (facetId === FACET_TYPE) {
        setTypeFilter("all");
        if (typeParam) navigate(langPath("community/explore"), { replace: true });
      } else if (facetId === FACET_LANGUAGE) {
        setLanguageFilter(null);
      } else if (facetId === FACET_LEVEL) {
        setLevelFilters(new Set());
      } else if (facetId === FACET_OTHER) {
        setOtherFilters(new Set());
      }
    },
    [typeParam, navigate, langPath],
  );

  const handleClearAll = useCallback(() => {
    setLanguageFilter(null);
    setTypeFilter("all");
    setLevelFilters(new Set());
    setOtherFilters(new Set());
    setSearch("");
    setSortBy("newest");
    if (typeParam || tagParam || langParam) {
      navigate(langPath("community/explore"), { replace: true });
    }
  }, [setSearch, typeParam, tagParam, langParam, navigate, langPath]);

  const showSearchResults = search.trim().length > 0;

  // Marketplace rows — one unified table regardless of type/search/filter state.
  const rows: CommunityContentRow[] = useMemo(() => {
    return filteredBrowse.map((addon) => {
      const id = addon.id;
      let to = "#";
      let onAction: (() => void) | undefined;
      let onRowClick: (() => void) | undefined;
      let isSubscribed = false;
      let actionLoading = false;

      if (addon.kind === "flashcard-pack") {
        const deckId = "deckId" in addon ? addon.deckId ?? id : id;
        const deck = apiDecksById.get(deckId);
        to = langPath(`community/decks/${deckId}`);
        isSubscribed = subscribedIds.has(deckId);
        actionLoading = subscribeLoading === deckId;
        onAction = isSubscribed
          ? () => handleUnsubscribe("deck", deckId)
          : () => handleSubscribe("deck", deckId);
        // Row click opens the preview modal when we have the full deck
        // payload (it's already in apiDecksById). Falls back to the edit
        // route when we don't. ``addon`` arg is unused for community
        // browse — null per the existing call sites in MyDecksPage.
        if (deck) {
          onRowClick = () =>
            openDeckPreview(deckResponseToFlashcardDeck(deck), null);
        }
      } else if (addon.kind === "story" && "storyId" in addon) {
        const sid = String((addon as StoryCardItem).storyId ?? id);
        // TODO: route does not exist; ensure flag stays off until route lands.
        to = langPath(`community/stories/${sid}`);
        isSubscribed = subscribedIds.has(sid);
        actionLoading = subscribeLoading === sid;
        onAction = isSubscribed
          ? () => handleUnsubscribe("story", sid)
          : () => handleSubscribe("story", sid);
        const story = apiStoriesById.get(sid);
        if (story) {
          onRowClick = () => openStoryPreview(story);
        }
      } else if (addon.kind === "course") {
        to = langPath(`learn`);
      }

      return {
        id,
        kind: addon.kind,
        name: addon.name,
        description: addon.description,
        authorName: addon.maintainerName,
        languageId: addon.languageId,
        itemCount: addon.itemCount,
        upvoteCount: addon.upvoteCount,
        // Backend doesn't track downloads yet — use upvotes * fudge for demo numbers.
        downloadCount: addon.upvoteCount ? Math.round(addon.upvoteCount * 3.2) : 0,
        updatedAt: addon.updatedAt,
        image: (addon as DeckCardItem).image ?? undefined,
        to,
        onRowClick,
        isSubscribed,
        onAction,
        actionLoading,
      };
    });
  }, [
    filteredBrowse,
    apiDecksById,
    apiStoriesById,
    langPath,
    subscribedIds,
    subscribeLoading,
    handleSubscribe,
    handleUnsubscribe,
    openDeckPreview,
    openStoryPreview,
  ]);

  // Preview-on-name-click now lives in ``onRowClick`` above — these are
  // referenced inside the rows useMemo so no void-shims required.
  void refreshSubscribedSets;

  const searchSlot = (
    <input
      type="search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder={t("community.contentBrowserSearchPlaceholder")}
      className="w-44 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent sm:w-56"
    />
  );

  // Cards vs. detailed list view — persisted to localStorage.
  const VIEW_KEY = "lingo:community-explore-view";
  const [view, setView] = useState<"cards" | "list">(() => {
    try {
      const stored = localStorage.getItem(VIEW_KEY);
      return stored === "list" ? "list" : "cards";
    } catch {
      return "cards";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  // Pagination — client-side for now.
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [search, languageFilter, typeFilter, sortBy, levelFilters, otherFilters, tagParam]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [rows, page],
  );

  // Filter chips — pull labels from facet option lists so the chip reads the
  // same as the sidebar checkbox.
  const chips: ChipDescriptor[] = useMemo(() => {
    const out: ChipDescriptor[] = [];
    if (typeFilter !== "all") {
      const opt = typeFacetOptions.find((o) => o.value === typeFilter);
      if (opt) out.push({ facetId: FACET_TYPE, value: typeFilter, label: opt.label });
    }
    if (languageFilter && languageFilter !== "all") {
      const cfg = getLanguageConfig(languageFilter);
      out.push({
        facetId: FACET_LANGUAGE,
        value: languageFilter,
        label: `${cfg?.flag ?? "🌐"} ${cfg?.name ?? languageFilter}`,
      });
    }
    if (tagParam) {
      out.push({
        facetId: "tag",
        value: tagParam,
        label: `#${tagParam}`,
      });
    }
    for (const lvl of levelFilters) {
      const opt = LEVEL_OPTIONS.find((o) => o.value === lvl);
      if (opt) out.push({ facetId: FACET_LEVEL, value: lvl, label: opt.label });
    }
    for (const flag of otherFilters) {
      const opt = OTHER_OPTIONS.find((o) => o.value === flag);
      if (opt) out.push({ facetId: FACET_OTHER, value: flag, label: opt.label });
    }
    return out;
  }, [typeFilter, languageFilter, levelFilters, otherFilters, typeFacetOptions, tagParam]);

  const clearTag = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tag");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const hasActiveFilters = chips.length > 0 || showSearchResults;
  const showFeatured = !hasActiveFilters && rows.length === 0;

  return (
    <CommunityDecksLayout browseCount={browseCount} searchSlot={searchSlot}>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
        <FacetSidebar
          facets={facets}
          selections={selections}
          onToggle={handleFacetToggle}
          onClear={handleClearFacet}
          onClearAll={handleClearAll}
          clearAllLabel={t("community.contentBrowserClearAll")}
          resetLabel={t("community.contentBrowserReset", "Reset")}
          searchWithinPlaceholder={t(
            "community.contentBrowserFacetSearchPlaceholder",
            "Filter…",
          )}
        />

        <section className="min-w-0 flex-1 space-y-4">
          {chips.length > 0 && (
            <CommunitySelectedChips
              chips={chips}
              onRemove={handleFacetToggle}
              onClearAll={handleClearAll}
              clearAllLabel={t("community.contentBrowserClearAll")}
            />
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{browseCount}</span>{" "}
              {t("community.contentBrowserResultsLabel").toLowerCase()}
              {showSearchResults && ` · "${search}"`}
            </p>
            <div className="flex items-center gap-2">
              <div
                role="tablist"
                aria-label={t("community.exploreViewToggleLabel", "View")}
                className="inline-flex overflow-hidden rounded-md border border-border bg-surface"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "cards"}
                  onClick={() => setView("cards")}
                  className={
                    view === "cards"
                      ? "inline-flex items-center gap-1 bg-accent-muted px-2 py-1 text-xs font-medium text-accent"
                      : "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted"
                  }
                  title={t("community.exploreViewCards", "Cards")}
                >
                  <Icon name="layoutGrid" size={14} aria-hidden />
                  <span className="hidden sm:inline">
                    {t("community.exploreViewCards", "Cards")}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "list"}
                  onClick={() => setView("list")}
                  className={
                    view === "list"
                      ? "inline-flex items-center gap-1 bg-accent-muted px-2 py-1 text-xs font-medium text-accent"
                      : "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted"
                  }
                  title={t("community.exploreViewList", "List")}
                >
                  <Icon name="list" size={14} aria-hidden />
                  <span className="hidden sm:inline">
                    {t("community.exploreViewList", "List")}
                  </span>
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="hidden sm:inline">
                  {t("community.contentBrowserSortBy")}
                </span>
                <select
                  value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="newest">
                  {t("community.contentBrowserSortNewest")}
                </option>
                <option value="trending">
                  {t("community.contentBrowserSortTrending", "Trending")}
                </option>
                <option value="upvotes">
                  {t("community.contentBrowserSortUpvotes")}
                </option>
                  <option value="name">
                    {t("community.contentBrowserSortName")}
                  </option>
                </select>
              </label>
            </div>
          </div>

          {showFeatured && <FeaturedStrip />}

          {view === "list" ? (
            <CommunityContentTable
              rows={pagedRows}
              emptyMessage={
                apiDecksLoading
                  ? t("common.loading")
                  : t("community.contentBrowserNoResults")
              }
            />
          ) : pagedRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-text-muted">
              {apiDecksLoading
                ? t("common.loading")
                : t("community.contentBrowserNoResults")}
            </div>
          ) : (
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-1 xl:grid-cols-2">
              {pagedRows.map((row) => {
                // Wire the preview button on the card to the same callback the
                // row-name click uses. ``row.onRowClick`` is built upstream to
                // call ``openDeckPreview`` or ``openStoryPreview`` based on the
                // row's kind, so we forward it to the appropriate prop here.
                const onPreview =
                  row.kind === "flashcard-pack" ? row.onRowClick : undefined;
                const onStoryPreviewProp =
                  row.kind === "story" ? row.onRowClick : undefined;
                return (
                  <CommunityItemCard
                    key={row.id}
                    item={{
                      id: row.id,
                      name: row.name,
                      description: row.description ?? "",
                      languageId: row.languageId,
                      kind: row.kind,
                      itemCount: row.itemCount,
                      upvoteCount: row.upvoteCount,
                      maintainerName: row.authorName,
                      image: row.image ?? null,
                    }}
                    variant="full"
                    t={t}
                    langPath={langPath}
                    isSubscribed={row.isSubscribed}
                    subscribeLoading={row.actionLoading}
                    onSubscribe={row.onAction}
                    onUnsubscribe={row.onAction}
                    onPreview={onPreview}
                    onStoryPreview={onStoryPreviewProp}
                    showCommunityBadge
                  />
                );
              })}
            </div>
          )}

          {pageCount > 1 && (
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          )}
        </section>
      </div>
    </CommunityDecksLayout>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
}) {
  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm text-text-secondary hover:bg-surface-muted disabled:opacity-50"
      >
        ‹
      </button>
      {Array.from({ length: pageCount }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={
            i === page
              ? "rounded-md bg-accent px-2.5 py-1 text-sm font-semibold text-white"
              : "rounded-md border border-border bg-surface px-2.5 py-1 text-sm text-text-secondary hover:bg-surface-muted"
          }
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
        disabled={page === pageCount - 1}
        className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm text-text-secondary hover:bg-surface-muted disabled:opacity-50"
      >
        ›
      </button>
    </nav>
  );
}

// Each card links to a pre-filtered Explore URL. Tag-based filtering
// matches against deck name/description (substring) since tags aren't
// yet a structured field — see ContentBrowserPage filter pipeline.
// Korean Pathway has no canonical tag yet so it falls back to ?lang=ko.
const FEATURED_MOCK = [
  {
    id: "featured-1",
    title: "Korean Beginner Pathway",
    subtitle: "Official · 240 cards",
    accent: "from-accent to-accent-hover",
    to: "?lang=ko",
  },
  {
    id: "featured-2",
    title: "JLPT N5 Vocabulary",
    subtitle: "Maintained · 600 cards",
    accent: "from-warning to-error",
    to: "?tag=jlpt-n5",
  },
  {
    id: "featured-3",
    title: "K-Drama Phrases",
    subtitle: "Verified · 180 cards",
    accent: "from-info to-accent",
    to: "?tag=kdrama",
  },
];

function FeaturedStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {FEATURED_MOCK.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          className="block overflow-hidden rounded-lg border border-border bg-surface transition hover:border-accent hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className={`h-16 bg-gradient-to-br ${item.accent}`} aria-hidden />
          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Featured
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-text-primary">
              {item.title}
            </p>
            <p className="text-xs text-text-muted">{item.subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

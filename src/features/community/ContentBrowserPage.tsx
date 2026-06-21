import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  getLanguageConfig,
  LANGUAGE_CONFIGS,
  AVAILABLE_LEARNING_LANGUAGE_IDS,
} from "@/shared/domain/languageConfig";
import type { CommunityAddon as ApiCommunityAddon } from "@/shared/api/community";
import {
  CommunityContentTable,
  type CommunityContentRow,
} from "./components/CommunityContentTable";
import { CommunityItemCard } from "./components/CommunityItemCard";
import { Icon } from "@/shared/components/Icon";
import type { ChipDescriptor } from "./components/CommunitySelectedChips";
import { BrowseSearchBar, type BrowseTypeOption } from "./components/BrowseSearchBar";
import { BrowseFloatingFilterBar } from "./components/BrowseFloatingFilterBar";
import { CommunityDiscoveryLayout } from "./CommunityDiscoveryLayout";
import { useBrowseSubscribedContent } from "./useBrowseSubscribedContent";
import { useCreatorDirectory } from "./hooks/useCreatorDirectory";
import { useCommunityContent } from "./CommunityContentContext";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { FacetSidebar, type Facet } from "@/shared/components/ui/FacetSidebar";
import { useApi } from "@/shared/api/provider";
import type { DeckResponse } from "@/shared/api/decks";
import { sortByUpdatedAtDesc } from "@/shared/utils/dateUtils";
import { formatTimeAgo } from "@/shared/utils/formatDate";
import type { StoryResponse } from "@/shared/api/stories";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "./types";

/** Content Browser: courses, flashcard packs, and stories. */
type ContentType = "course" | "flashcard-pack" | "story";

type SortOption = "newest" | "trending" | "upvotes" | "name";

const TRENDING_MIN_UPVOTES = 5;

const FACET_TYPE = "type";
const FACET_SORT = "sort";
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
    maintainerIds: d.authorId ? [d.authorId] : [],
    upvoteCount: d.voteCount ?? 0,
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
    maintainerIds: s.authorId ? [s.authorId] : [],
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
  const {
    decks: decksApi,
    users: usersApi,
    stories: storiesApi,
    community: communityApi,
  } = useApi();
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

  // Language is multi-select: each piece of content carries exactly ONE
  // language (DB column `language_id TEXT NOT NULL`), so selecting multiple
  // languages is an OR-union over that single field. Empty set = all languages.
  const [languageFilters, setLanguageFilters] = useState<Set<string>>(() =>
    langParam ? new Set([langParam]) : new Set(),
  );
  // Default to the first enabled content type — no "All" view since
  // story/deck/course cards diverge fundamentally and will eventually grow
  // their own filter bars.
  const firstEnabledType: ContentType = explore.flashcardDecks
    ? "flashcard-pack"
    : explore.courses
      ? "course"
      : "story";
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">(firstEnabledType);
  // Default to "most popular" (votes) per the feedback — surfaces the
  // highest-voted decks first instead of an editorial "featured" flag.
  const [sortBy, setSortBy] = useState<SortOption>("upvotes");
  const [levelFilters, setLevelFilters] = useState<Set<string>>(new Set());
  const [otherFilters, setOtherFilters] = useState<Set<string>>(new Set());

  // Sync language filter when ?lang= changes from outside (back/forward nav).
  useEffect(() => {
    if (langParam) {
      setLanguageFilters(new Set([langParam]));
    }
  }, [langParam]);

  // Seed the type filter from `?type=` ONLY when that param actually changes.
  // The segmented control owns the live value afterwards — re-running this on
  // every render (langPath/navigate identities aren't stable) would clobber the
  // user's selection. Tracked via a ref keyed on the last-applied param.
  const lastTypeParamRef = useRef<string | null>(null);
  useEffect(() => {
    const key = typeParam ?? "";
    if (lastTypeParamRef.current === key) return;
    lastTypeParamRef.current = key;
    let resolvedType: ContentType | "all" = TYPE_FROM_PARAM[key] ?? "all";
    if (resolvedType === "story" && !explore.stories) resolvedType = "all";
    if (resolvedType === "course" && !explore.courses) resolvedType = "all";
    if (resolvedType === "flashcard-pack" && !explore.flashcardDecks) resolvedType = "all";
    // No "All" view — fall back to the first enabled type when the URL
    // doesn't specify one (or specifies a disabled one).
    if (resolvedType === "all") {
      resolvedType = firstEnabledType;
      if (typeParam && TYPE_FROM_PARAM[typeParam] !== undefined) {
        navigate(langPath("community/browse"), { replace: true });
      }
    }
    setTypeFilter(resolvedType);
  }, [typeParam, explore.stories, explore.courses, explore.flashcardDecks, navigate, langPath, firstEnabledType]);

  const [apiDecks, setApiDecks] = useState<DeckResponse[]>([]);
  const [apiDecksLoading, setApiDecksLoading] = useState(true);
  const [subscribedDecks, setSubscribedDecks] = useState<DeckResponse[]>([]);
  const [apiStories, setApiStories] = useState<StoryResponse[]>([]);
  const [_apiStoriesLoading, setApiStoriesLoading] = useState(true);
  const [subscribedStories, setSubscribedStories] = useState<StoryResponse[]>([]);

  const { openDeckPreview, openStoryPreview } = useCommunityContent();
  const { resolveCreator } = useCreatorDirectory();

  const langId = language?.id ?? "ko";
  // Fetch ALL languages from the API, then filter client-side. The backend
  // list endpoints only accept a single `language_id`, but the facet is now
  // multi-select (OR-union over the single-language field), so we can't push
  // the filter down. The admin/browse lists are small enough to filter locally.
  // The learner's current language gets a "Suggested" star but isn't applied.
  const selectedLanguages = languageFilters;

  useEffect(() => {
    if (!explore.flashcardDecks) {
      setApiDecks([]);
      setApiDecksLoading(false);
      return;
    }
    let ok = true;
    setApiDecksLoading(true);
    decksApi
      .listAdminDecks({ status: "published" })
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
  }, [decksApi, explore.flashcardDecks]);

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
      .listBrowseStories({})
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
  }, [storiesApi, explore.stories]);

  const { search, setSearch, subscribeLoading, handleSubscribe, handleUnsubscribe } =
    useBrowseSubscribedContent({ onRefresh: refreshSubscribedSets });

  // Seed the search box + sort from the URL once on mount so the Discover
  // home's hero search / "see all" links land pre-filtered.
  const qParam = searchParams.get("q");
  const sortParam = searchParams.get("sort");
  useEffect(() => {
    if (qParam) setSearch(qParam);
    if (sortParam === "newest" || sortParam === "trending" || sortParam === "upvotes" || sortParam === "name") {
      setSortBy(sortParam);
    }
    // Mount-only seed; subsequent typing/sorting is local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Companion decks are study-only (tied to a story) and excluded from browse.
  const apiDeckCards = useMemo(
    () => apiDecks.filter((d) => !d.companionToStoryId).map(deckToCardItem),
    [apiDecks],
  );
  const apiStoryCards = useMemo(() => apiStories.map(storyToCardItem), [apiStories]);

  const subscribedIds = useMemo(
    () =>
      new Set([
        ...subscribedDecks.map((d) => d.id),
        ...subscribedStories.map((s) => s.id),
      ]),
    [subscribedDecks, subscribedStories],
  );

  // Backend addons cover community-uploaded courses/flashcard-packs/stories.
  // Why: backend AddonResponse has no maintainerIds/discussionCount/userUpvoted —
  // we map to a best-effort CommunityAddon shape; missing fields stay undefined.
  const addonsQuery = useQuery<ApiCommunityAddon[]>({
    queryKey: ["community", "addons", "all-languages"],
    queryFn: ({ signal }) => communityApi.listAddons({}, signal),
    staleTime: 60_000,
  });

  const communityAddons = useMemo<CommunityAddon[]>(() => {
    const list = addonsQuery.data ?? [];
    return list
      .filter((a): a is ApiCommunityAddon =>
        a.kind === "course" || a.kind === "story",
      )
      .filter((a) => {
        if (a.kind === "course" && !explore.courses) return false;
        if (a.kind === "story" && !explore.stories) return false;
        return true;
      })
      .map<CommunityAddon>((a) => ({
        id: a.id,
        kind: a.kind as CommunityAddon["kind"],
        languageId: a.languageId,
        name: a.name,
        description: a.description,
        sourceUrl: a.sourceUrl ?? undefined,
        maintainerIds: a.authorId ? [a.authorId] : [],
        upvoteCount: a.upvoteCount,
        updatedAt: a.updatedAt,
        itemCount: a.itemCount ?? undefined,
      }));
  }, [addonsQuery.data, explore.courses, explore.stories]);

  const browseContent = useMemo(() => {
    const parts: (DeckCardItem | StoryCardItem | CommunityAddon)[] = [];
    if (explore.flashcardDecks) parts.push(...apiDeckCards);
    if (explore.stories) parts.push(...apiStoryCards);
    parts.push(...communityAddons);
    return parts;
  }, [apiDeckCards, apiStoryCards, communityAddons, explore.flashcardDecks, explore.stories]);

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
      // Multi-select language: OR-union over each item's single language.
      if (selectedLanguages.size > 0 && !selectedLanguages.has(a.languageId))
        return false;
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
  }, [browseContent, search, selectedLanguages, typeFilter, sortBy, tagParam]);

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

  // Quick sort lives at the top of the sidebar as a single-select facet so it
  // doesn't read as discordant chrome elsewhere on the page. "Most popular"
  // (by votes) is the lead option per the feedback.
  const sortFacetOptions = useMemo(
    () => [
      { value: "upvotes", label: t("community.contentBrowserSortUpvotes") },
      { value: "trending", label: t("community.contentBrowserSortTrending", "Trending") },
      { value: "newest", label: t("community.contentBrowserSortNewest") },
      { value: "name", label: t("community.contentBrowserSortName") },
    ],
    [t],
  );

  const facets: Facet[] = useMemo(() => {
    // NB: content-TYPE filter is NOT in the sidebar — it's a segmented control
    // in the BrowseSearchBar header because the content types render
    // fundamentally different cards (story vs deck vs course).
    const out: Facet[] = [];
    out.push({
      id: FACET_SORT,
      label: t("community.contentBrowserSortBy"),
      options: sortFacetOptions,
      multiSelect: false,
      searchableAfter: 0,
    });
    out.push({
      id: FACET_LANGUAGE,
      label: t("community.contentBrowserFacetLanguage"),
      options: languageFacetOptions,
      multiSelect: true,
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
  }, [languageFacetOptions, sortFacetOptions, t]);

  const selections: Record<string, string[]> = useMemo(() => {
    const out: Record<string, string[]> = {};
    // FACET_TYPE intentionally not included — content type is a segmented
    // control in the BrowseSearchBar header, not a sidebar facet.
    out[FACET_SORT] = [sortBy];
    if (selectedLanguages.size > 0)
      out[FACET_LANGUAGE] = Array.from(selectedLanguages);
    if (levelFilters.size > 0) out[FACET_LEVEL] = Array.from(levelFilters);
    if (otherFilters.size > 0) out[FACET_OTHER] = Array.from(otherFilters);
    return out;
  }, [sortBy, selectedLanguages, levelFilters, otherFilters]);

  const handleFacetToggle = useCallback(
    (facetId: string, value: string) => {
      if (facetId === "tag") {
        // Chips reuse the toggle callback as their remove handler.
        clearTag();
        return;
      }
      if (facetId === FACET_TYPE) {
        // Type chip remove → clear type filter back to the first enabled type.
        setTypeFilter(typeFilter === value ? firstEnabledType : (value as ContentType));
      } else if (facetId === FACET_SORT) {
        // Sort is single-select; clicking the active option is a no-op.
        setSortBy(value as SortOption);
      } else if (facetId === FACET_LANGUAGE) {
        setLanguageFilters((prev) => {
          const next = new Set(prev);
          if (next.has(value)) next.delete(value);
          else next.add(value);
          return next;
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typeFilter, firstEnabledType],
  );

  // FACET_TYPE is not in the sidebar facets (it's a segmented control in the
  // header), so the clear-facet button never fires for it. Type is cleared via
  // the chip strip's X handler, which routes through `handleFacetToggle`.
  const handleClearFacet = useCallback(
    (facetId: string) => {
      if (facetId === FACET_SORT) {
        setSortBy("upvotes");
      } else if (facetId === FACET_LANGUAGE) {
        setLanguageFilters(new Set());
      } else if (facetId === FACET_LEVEL) {
        setLevelFilters(new Set());
      } else if (facetId === FACET_OTHER) {
        setOtherFilters(new Set());
      }
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    setLanguageFilters(new Set());
    setTypeFilter(firstEnabledType);
    setLevelFilters(new Set());
    setOtherFilters(new Set());
    setSearch("");
    setSortBy("upvotes");
    if (typeParam || tagParam || langParam) {
      // Stay on Browse — strip the seed params from the URL.
      navigate(langPath("community/browse"), { replace: true });
    }
  }, [setSearch, typeParam, tagParam, langParam, navigate, langPath, firstEnabledType]);

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
      // Skim samples loaded up-front with the list — no fetch on hover.
      let previewSamples: string[] | undefined;

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
          // A few card fronts make the deck skimmable on hover.
          previewSamples = (deck.cards ?? [])
            .slice(0, 4)
            .map((c) => c.front)
            .filter(Boolean);
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
          if (story.description) previewSamples = [story.description];
        }
      } else if (addon.kind === "course") {
        to = langPath(`learn`);
      }

      // Resolve the creator (name + avatar) from the directory when the
      // content carries an author id. Falls back to any maintainerName the
      // addon already reported.
      const authorId = addon.maintainerIds[0];
      const creator = resolveCreator(authorId);

      return {
        id,
        kind: addon.kind,
        name: addon.name,
        description: addon.description,
        authorName: creator?.displayName ?? addon.maintainerName,
        authorAvatarUrl: creator?.avatarUrl,
        authorUsername: creator?.username,
        languageId: addon.languageId,
        itemCount: addon.itemCount,
        upvoteCount: addon.upvoteCount,
        updatedAt: addon.updatedAt,
        image: (addon as DeckCardItem).image ?? undefined,
        to,
        onRowClick,
        isSubscribed,
        onAction,
        actionLoading,
        previewSamples,
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
    resolveCreator,
  ]);

  // Preview-on-name-click now lives in ``onRowClick`` above — these are
  // referenced inside the rows useMemo so no void-shims required.
  void refreshSubscribedSets;

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
  }, [search, selectedLanguages, typeFilter, sortBy, levelFilters, otherFilters, tagParam]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [rows, page],
  );

  // Filter chips — pull labels from facet option lists so the chip reads the
  // same as the sidebar checkbox.
  const chips: ChipDescriptor[] = useMemo(() => {
    // NB: content type is NOT a chip — it's the always-present segmented
    // control in the header, so a redundant chip would be confusing.
    const out: ChipDescriptor[] = [];
    for (const lId of selectedLanguages) {
      const cfg = getLanguageConfig(lId);
      out.push({
        facetId: FACET_LANGUAGE,
        value: lId,
        label: `${cfg?.flag ?? "🌐"} ${cfg?.name ?? lId}`,
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
  }, [selectedLanguages, levelFilters, otherFilters, tagParam]);

  // Active filter count for the floating bar (filters only, not sort/type).
  const activeFilterCount = chips.length;

  // Build the content-type options for the segmented control.
  const browseTypeOptions: BrowseTypeOption[] = useMemo(() => {
    const iconFor: Record<string, BrowseTypeOption["icon"]> = {
      "flashcard-pack": "layers",
      course: "graduationCap",
      story: "bookOpen",
    };
    return typeFacetOptions.map((o) => ({
      value: o.value,
      label: o.label,
      icon: iconFor[o.value],
    }));
  }, [typeFacetOptions]);

  // Sort label + cycle for the floating bar quick-toggle.
  const sortLabelMap: Record<SortOption, string> = useMemo(
    () => ({
      upvotes: t("community.contentBrowserSortUpvotes"),
      trending: t("community.contentBrowserSortTrending", "Trending"),
      newest: t("community.contentBrowserSortNewest"),
      name: t("community.contentBrowserSortName"),
    }),
    [t],
  );
  const cycleSort = useCallback(() => {
    const order: SortOption[] = ["upvotes", "trending", "newest", "name"];
    setSortBy((prev) => order[(order.indexOf(prev) + 1) % order.length]);
  }, []);

  // Scroll back to the sidebar when the floating "Filters" button is tapped.
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollToFilters = useCallback(() => {
    sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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

  const resultSummary = (
    <span>
      <span className="font-semibold text-text-primary">{browseCount}</span>{" "}
      {t("community.contentBrowserResultsLabel").toLowerCase()}
      {showSearchResults && ` · "${search}"`}
    </span>
  );

  return (
    <CommunityDiscoveryLayout>
      <BrowseSearchBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("community.contentBrowserSearchPlaceholder")}
        typeOptions={browseTypeOptions}
        typeValue={typeFilter === "all" ? firstEnabledType : typeFilter}
        onTypeChange={(v) => setTypeFilter(v as ContentType)}
        typeAriaLabel={t("community.contentBrowserFacetType")}
        chips={chips}
        onRemoveChip={handleFacetToggle}
        onClearAll={handleClearAll}
        clearAllLabel={t("community.contentBrowserClearAll")}
      />

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:gap-6">
        <div ref={sidebarRef} className="w-full shrink-0 lg:w-56">
          <FacetSidebar
            compact
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
        </div>

        <section className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-muted">{resultSummary}</p>
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
          </div>

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
                      maintainerUsername: row.authorUsername,
                      maintainerAvatarUrl: row.authorAvatarUrl,
                      image: row.image ?? null,
                      previewSamples: row.previewSamples,
                      updatedLabel: row.updatedAt
                        ? formatTimeAgo(row.updatedAt)
                        : undefined,
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

      <BrowseFloatingFilterBar
        activeCount={activeFilterCount}
        resultCount={browseCount}
        sortLabel={sortLabelMap[sortBy]}
        onCycleSort={cycleSort}
        onOpenFilters={scrollToFilters}
        filtersLabel={t("community.contentBrowserFloatingFilters", "Filters")}
        sortByLabel={t("community.contentBrowserSortBy")}
        resultsLabel={t("community.contentBrowserResultsLabel").toLowerCase()}
      />
    </CommunityDiscoveryLayout>
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


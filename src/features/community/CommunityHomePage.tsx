import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ContentRail } from "@/shared/components/ui/ContentRail";
import { cn } from "@/shared/components/ui/cn";
import { sortByUpdatedAtDesc } from "@/shared/utils/dateUtils";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { DeckResponse } from "@/shared/api/decks";
import { CommunityDiscoveryLayout } from "./CommunityDiscoveryLayout";
import { useCommunityContent } from "./CommunityContentContext";
import { useMarketplaceContent, type MarketplaceItem } from "./hooks/useMarketplaceContent";
import { useTopContributors } from "./hooks/useTopContributors";
import { STORIES_TEASER_ITEMS } from "./hooks/storiesTeaser";
import { MarketplaceCard } from "./components/MarketplaceCard";
import { ContributorCard } from "./components/ContributorCard";
import { FeaturedHero } from "./components/FeaturedHero";
import { MarketplaceHero } from "./components/MarketplaceHero";

const POPULAR_COUNT = 7;
const NEW_COUNT = 10;
const EXPLORE_COUNT = 12;

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

export function CommunityHomePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { openDeckPreview, openStoryPreview } = useCommunityContent();
  const { items, isLoading, isError } = useMarketplaceContent();
  const { contributors, isLoading: contributorsLoading } = useTopContributors();

  const previewFor = (item: MarketplaceItem) => {
    if (item.kind === "flashcard-pack" && item.deck) {
      return () =>
        openDeckPreview(deckResponseToFlashcardDeck(item.deck!), null, {
          author: item.creator
            ? {
                displayName: item.creator.displayName,
                username: item.creator.username,
                avatarUrl: item.creator.avatarUrl,
              }
            : undefined,
          upvoteCount: item.upvoteCount,
        });
    }
    if (item.kind === "story" && item.story) {
      return () => openStoryPreview(item.story!);
    }
    return undefined;
  };

  const suggestedLangId = language?.id;

  // Lead rail = MOST POPULAR. Pure popularity ranking by upvotes (newest breaks
  // ties) so the genuinely most-loved content — e.g. a big Core deck — surfaces
  // first, regardless of any editorial "featured" flag (the backend has none).
  const popular = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      })
      .slice(0, POPULAR_COUNT);
  }, [items]);

  const newest = useMemo(
    () => sortByUpdatedAtDesc(items).slice(0, NEW_COUNT),
    [items],
  );

  // "More to explore" — a single rail replacing the old per-language rails.
  // Surfaces content the learner is less likely to have already seen on this
  // page: everything that didn't make the popular/new sets, with content in a
  // language other than the one they're studying nudged first (genuinely "other
  // languages / stuff you haven't seen"). Honest proxy — we have no per-user
  // viewed-content signal yet.
  const explore = useMemo(() => {
    const seen = new Set<string>([
      ...popular.map((i) => i.id),
      ...newest.map((i) => i.id),
    ]);
    const rest = items.filter((i) => !seen.has(i.id));
    return rest
      .sort((a, b) => {
        const otherA = a.languageId !== suggestedLangId ? 1 : 0;
        const otherB = b.languageId !== suggestedLangId ? 1 : 0;
        if (otherA !== otherB) return otherB - otherA;
        return b.upvoteCount - a.upvoteCount;
      })
      .slice(0, EXPLORE_COUNT);
  }, [items, popular, newest, suggestedLangId]);

  const heroItem = popular[0];
  const popularRest = popular.slice(1);

  // Real catalog metrics for the hero strip — never fabricated.
  const metrics = useMemo(() => {
    const creators = new Set(
      items.filter((i) => i.creator).map((i) => i.creator!.userId),
    );
    return { decks: items.length, creators: creators.size };
  }, [items]);

  if (isLoading) {
    return (
      <CommunityDiscoveryLayout>
        <HomeSkeleton />
      </CommunityDiscoveryLayout>
    );
  }

  if (isError || items.length === 0) {
    return (
      <CommunityDiscoveryLayout>
        <EmptyState
          icon={<Icon name="compass" size={22} aria-hidden />}
          title={t("community.homeEmptyTitle", "Nothing here yet")}
          description={t(
            "community.homeEmptyDescription",
            "Community content will show up here as learners publish decks and stories. Be the first to contribute.",
          )}
          action={
            <Link
              to={langPath("community/decks/new")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              <Icon name="plus" size={16} aria-hidden />
              {t("community.contentBrowserNewDeck")}
            </Link>
          }
        />
      </CommunityDiscoveryLayout>
    );
  }

  return (
    <CommunityDiscoveryLayout>
      <div className="space-y-8">
        <MarketplaceHero metrics={metrics} />

        {/* Most popular — Fortnite-shop-style mosaic: a tall spotlight tile next
            to a grid of varied-size tiles so the rows don't read flat. */}
        {heroItem ? (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Icon name="flame" size={18} aria-hidden />
              {t("community.homePopularBadge", "Most popular")}
            </h2>
            <PopularMosaic
              hero={heroItem}
              rest={popularRest}
              previewFor={previewFor}
            />
          </section>
        ) : null}

        {/* New content — moved ABOVE Top contributors. */}
        {newest.length > 0 ? (
          <ContentRail
            title={t("community.homeNewTitle", "New content")}
            subtitle={t("community.homeNewSubtitle", "Freshly published by the community")}
            icon="sparkles"
            seeAllTo={langPath("community/browse?sort=newest")}
            seeAllLabel={t("community.homeSeeAll", "See all")}
          >
            {newest.map((item) => (
              <MarketplaceCard key={item.id} item={item} onPreview={previewFor(item)} />
            ))}
          </ContentRail>
        ) : null}

        {/* Top contributors — kept, now below New content. */}
        {contributorsLoading ? (
          <ContributorRailSkeleton title={t("community.homeContributorsTitle", "Top contributors")} />
        ) : contributors.length > 0 ? (
          <ContentRail
            title={t("community.homeContributorsTitle", "Top contributors")}
            subtitle={t(
              "community.homeContributorsSubtitle",
              "Learners building Open Lingo's community library",
            )}
            icon="trophy"
            seeAllTo={langPath("community/contributors")}
            seeAllLabel={t("community.homeSeeAll", "See all")}
          >
            {contributors.map((c) => (
              <ContributorCard key={c.userId} contributor={c} />
            ))}
          </ContentRail>
        ) : null}

        {/* More to explore — single rail replacing the per-language rails. */}
        {explore.length > 0 ? (
          <ContentRail
            title={t("community.homeExploreTitle", "More to explore")}
            subtitle={t(
              "community.homeExploreSubtitle",
              "Other languages and content you haven't seen yet",
            )}
            icon="compass"
            seeAllTo={langPath("community/browse")}
            seeAllLabel={t("community.homeSeeAll", "See all")}
          >
            {explore.map((item) => (
              <MarketplaceCard key={item.id} item={item} onPreview={previewFor(item)} />
            ))}
          </ContentRail>
        ) : null}

        {/* Stories — coming soon (MOCK teaser tiles, non-interactive). */}
        <ContentRail
          title={t("community.homeStoriesTitle", "Stories — coming soon")}
          subtitle={t(
            "community.homeStoriesSubtitle",
            "Interactive, scenario-based reading is in the works",
          )}
          icon="stories"
        >
          {STORIES_TEASER_ITEMS.map((item) => (
            <MarketplaceCard key={item.id} item={item} comingSoon />
          ))}
        </ContentRail>

        {/* Browse-all entry */}
        <div className="flex justify-center pt-2">
          <Link
            to={langPath("community/browse")}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:border-accent hover:text-accent"
          >
            <Icon name="layoutGrid" size={16} aria-hidden />
            {t("community.homeBrowseAll", "Browse all content")}
          </Link>
        </div>
      </div>
    </CommunityDiscoveryLayout>
  );
}

/**
 * PopularMosaic — the lead "shop window". A tall spotlight tile sits beside a
 * dense grid whose first tile spans two columns, so tile sizes vary and rows
 * break up instead of marching in a flat line. Tiles fall back to grid/compact
 * cards so the layout stays full even with mixed content.
 */
function PopularMosaic({
  hero,
  rest,
  previewFor,
}: {
  hero: MarketplaceItem;
  rest: MarketplaceItem[];
  previewFor: (item: MarketplaceItem) => (() => void) | undefined;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_2fr]">
      <FeaturedHero item={hero} onPreview={previewFor(hero)} />
      <div className="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3">
        {rest.map((item, i) => (
          <MarketplaceCard
            key={item.id}
            item={item}
            variant="grid"
            compact
            // First tile takes a wider span to break the row rhythm.
            className={cn(i === 0 && "col-span-2 sm:col-span-2")}
            onPreview={previewFor(item)}
          />
        ))}
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton height="h-28" className="rounded-card" />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_2fr]">
        <Skeleton height="h-72" className="rounded-card" />
        <div className="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              height="h-32"
              className={cn("rounded-card", i === 0 && "col-span-2")}
            />
          ))}
        </div>
      </div>
      {[0, 1].map((row) => (
        <div key={row} className="space-y-3">
          <Skeleton width="w-40" height="h-6" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width="w-64" height="h-52" className="shrink-0 rounded-card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContributorRailSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="w-44" height="h-40" className="shrink-0 rounded-card" />
        ))}
      </div>
    </div>
  );
}

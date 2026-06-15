import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ContentRail } from "@/shared/components/ui/ContentRail";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { sortByUpdatedAtDesc } from "@/shared/utils/dateUtils";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { DeckResponse } from "@/shared/api/decks";
import { CommunityDiscoveryLayout } from "./CommunityDiscoveryLayout";
import { useCommunityContent } from "./CommunityContentContext";
import { useMarketplaceContent, type MarketplaceItem } from "./hooks/useMarketplaceContent";
import { useTopContributors } from "./hooks/useTopContributors";
import { MarketplaceCard } from "./components/MarketplaceCard";
import { ContributorCard } from "./components/ContributorCard";
import { FeaturedHero } from "./components/FeaturedHero";
import { MarketplaceHero } from "./components/MarketplaceHero";

const FEATURED_COUNT = 5;
const NEW_COUNT = 10;
const PER_LANGUAGE = 8;
const LANGUAGE_RAILS = 3;

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

  // Featured: highest-voted content, suggested language nudged to the top so a
  // learner sees relevant content first. Falls back to newest when no votes.
  const featured = useMemo(() => {
    const byVotes = [...items].sort((a, b) => {
      const langA = a.languageId === suggestedLangId ? 1 : 0;
      const langB = b.languageId === suggestedLangId ? 1 : 0;
      if (langA !== langB) return langB - langA;
      if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });
    return byVotes.slice(0, FEATURED_COUNT);
  }, [items, suggestedLangId]);

  const newest = useMemo(
    () => sortByUpdatedAtDesc(items).slice(0, NEW_COUNT),
    [items],
  );

  // Group remaining content by language for "browse by language" rails. Order
  // languages by content volume, suggested language first.
  const languageRails = useMemo(() => {
    const groups = new Map<string, MarketplaceItem[]>();
    for (const it of items) {
      const arr = groups.get(it.languageId) ?? [];
      arr.push(it);
      groups.set(it.languageId, arr);
    }
    return Array.from(groups.entries())
      .sort((a, b) => {
        const sa = a[0] === suggestedLangId ? 1 : 0;
        const sb = b[0] === suggestedLangId ? 1 : 0;
        if (sa !== sb) return sb - sa;
        return b[1].length - a[1].length;
      })
      .slice(0, LANGUAGE_RAILS)
      .map(([languageId, list]) => ({
        languageId,
        items: sortByUpdatedAtDesc(list).slice(0, PER_LANGUAGE),
      }));
  }, [items, suggestedLangId]);

  const heroItem = featured[0];
  const featuredRest = featured.slice(1);

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
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
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

        {/* Featured spotlight + secondary featured rail */}
        {heroItem ? (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Icon name="sparkles" size={18} aria-hidden />
              {t("community.homeFeaturedBadge", "Featured")}
            </h2>
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <FeaturedHero item={heroItem} onPreview={previewFor(heroItem)} />
              <div className="grid grid-rows-2 gap-4">
                {featuredRest.slice(0, 2).map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    variant="grid"
                    onPreview={previewFor(item)}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Top contributors */}
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

        {/* New content */}
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

        {/* Browse by language */}
        {languageRails.map(({ languageId, items: langItems }) => {
          const cfg = getLanguageConfig(languageId);
          const label = `${cfg?.flag ?? "🌐"} ${cfg?.name ?? languageId}`;
          return (
            <ContentRail
              key={languageId}
              title={label}
              subtitle={t("community.homeByLanguageSubtitle", "Community content in this language")}
              seeAllTo={langPath(`community/browse?lang=${languageId}`)}
              seeAllLabel={t("community.homeSeeAll", "See all")}
            >
              {langItems.map((item) => (
                <MarketplaceCard key={item.id} item={item} onPreview={previewFor(item)} />
              ))}
            </ContentRail>
          );
        })}

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

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton height="h-28" className="rounded-card" />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton height="h-52 sm:h-56" className="rounded-xl" />
        <div className="grid grid-rows-2 gap-4">
          <Skeleton height="h-[6.25rem]" className="rounded-xl" />
          <Skeleton height="h-[6.25rem]" className="rounded-xl" />
        </div>
      </div>
      {[0, 1].map((row) => (
        <div key={row} className="space-y-3">
          <Skeleton width="w-40" height="h-6" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width="w-64" height="h-52" className="shrink-0 rounded-xl" />
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
          <Skeleton key={i} width="w-44" height="h-40" className="shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

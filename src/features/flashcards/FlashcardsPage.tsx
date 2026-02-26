import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { buildReviewQueue } from "./engine";
import { DeckPreviewModal } from "./DeckPreviewModal";
import { useSubscribedDecks } from "./useSubscribedDecks";
import type { Flashcard, FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "@/features/community/types";
import type { DeckResponse } from "@/shared/api/decks";

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

function DueCarousel({
  cards,
  dueCount,
  reviewHref,
  onPreviewDeck,
  t,
}: {
  cards: Flashcard[];
  dueCount: number;
  reviewHref: string;
  onPreviewDeck: () => void;
  t: (k: string) => string;
}) {
  const previewCards = useMemo(() => cards.slice(0, 6), [cards]);
  if (previewCards.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-border bg-surface p-4"
      aria-labelledby="flashcards-due-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="flashcards-due-heading"
          className="text-lg font-semibold text-text-primary"
        >
          {t("flashcards.dueToday")}
        </h2>
        <Link
          to={reviewHref}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          {t("flashcards.review")} {dueCount} {t("flashcards.cards")}
        </Link>
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
        <ul
          className="flex gap-3 pb-2"
          role="list"
          style={{ scrollSnapType: "x proximity" }}
        >
          {previewCards.map((card) => (
            <li
              key={card.id}
              className="flex min-w-[160px] shrink-0 snap-center"
              style={{ scrollSnapAlign: "start" }}
            >
              <button
                type="button"
                onClick={onPreviewDeck}
                className="flex h-32 w-full flex-col justify-center rounded-lg border border-border bg-surface-muted px-4 py-3 text-left transition hover:border-border-muted hover:bg-surface-muted"
              >
                <p className="line-clamp-3 text-base font-medium text-text-primary">
                  {card.front}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DeckCard({
  deck,
  onClick,
  settingsHref,
  t,
}: {
  deck: { id: string; name: string; cardCount: number; totalCount?: number };
  onClick: () => void;
  settingsHref?: string;
  t: (k: string) => string;
}) {
  const countLabel =
    deck.totalCount != null && deck.totalCount > deck.cardCount
      ? `${deck.cardCount} / ${deck.totalCount} ${t("flashcards.cards")}`
      : `${deck.cardCount} ${t("flashcards.cards")}`;
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface p-4 transition hover:border-border-muted hover:shadow">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
      >
        <div>
          <h3 className="font-medium text-text-primary">{deck.name}</h3>
          <p className="mt-0.5 text-sm text-text-muted">
            {countLabel}
          </p>
        </div>
        <Icon name="arrowRight" size={16} className="shrink-0 text-accent" />
      </button>
      {settingsHref && (
        <Link
          to={settingsHref}
          aria-label={t("flashcards.deckManager.settingsLabel")}
          className="shrink-0 rounded p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary"
        >
          <Icon name="settings" size={20} />
        </Link>
      )}
    </div>
  );
}

function CommunityPackCard({
  addon,
  onClick,
  t,
}: {
  addon: CommunityAddon;
  onClick: () => void;
  t: (k: string) => string;
}) {
  const coverUrl = getDeckImageUrl(addon.deckId ?? addon.id, addon.image);

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4">
      <img
        src={coverUrl}
        alt=""
        className="h-16 w-24 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-text-primary">{addon.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">
          {addon.description}
        </p>
        <p className="mt-2 text-xs text-text-muted">
          {addon.itemCount ?? "—"} {t("flashcards.cards")} · <Icon name="chevronUp" size={12} className="inline" /> {addon.upvoteCount}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted"
      >
        {t("flashcards.preview")}
      </button>
    </div>
  );
}

export function FlashcardsPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";

  const { subscribedDecks, isLoading: cardsDueLoading, invalidate } =
    useSubscribedDecks();

  const handleSubscriptionChange = useMemo(() => invalidate, [invalidate]);

  const { dueQueue, dueCount, deck, courseDecks, communityPacksWithDecks } =
    useMemo(() => {
      const byLang = subscribedDecks.filter(
        ({ addon }) => addon.languageId === langId
      );
      const allCards: Flashcard[] = [];
      for (const { deck: d } of byLang) {
        allCards.push(...(d.cards ?? []));
      }
      const { queue: dueQueue, totalCount: dueCount } = buildReviewQueue(allCards);
      const firstDeck = byLang[0]?.deck;
      const packs = byLang.map(({ addon, deck: d }) => ({
        addon,
        deck: deckResponseToFlashcardDeck(d),
      }));
      const decks = byLang.map(({ deck: d }) => ({
        id: d.id,
        name: d.name,
        cardCount: (d.cards ?? []).length,
        deck: deckResponseToFlashcardDeck(d),
      }));
      return {
        cards: allCards,
        dueQueue,
        dueCount,
        deck: firstDeck ? deckResponseToFlashcardDeck(firstDeck) : null,
        courseDecks: decks,
        communityPacksWithDecks: packs,
      };
    }, [subscribedDecks, langId]);

  const languageName = getLanguageConfig(langId)?.name ?? langId;

  const [previewDeck, setPreviewDeck] = useState<FlashcardDeck | null>(null);
  const [previewAddon, setPreviewAddon] = useState<CommunityAddon | null>(null);
  const showPreview = previewDeck != null || previewAddon != null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("flashcards.title")}
          </h1>
          <p className="mt-1 text-text-secondary">
            {t("flashcards.subtitle", { language: languageName })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={langPath("practice/flashcards/decks")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("flashcards.deckManager.title", "Deck Manager")}
          </Link>
          <Link
            to={langPath("practice/flashcards/cards")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("flashcards.cardManager.title", "Card Manager")}
          </Link>
        </div>
      </div>

      {cardsDueLoading ? (
        <section
          className="rounded-xl border border-border bg-surface-muted p-6 text-center"
          aria-labelledby="flashcards-due-heading"
        >
          <h2
            id="flashcards-due-heading"
            className="text-lg font-semibold text-text-primary"
          >
            {t("flashcards.dueToday")}
          </h2>
          <p className="mt-2 text-sm text-text-secondary" role="status">
            {t("common.loading", "Loading…")}
          </p>
        </section>
      ) : dueCount > 0 && dueQueue.length > 0 ? (
        <DueCarousel
          cards={dueQueue}
          dueCount={dueCount}
          reviewHref={langPath("practice/flashcards/review")}
          onPreviewDeck={() => {
            setPreviewAddon(null);
            setPreviewDeck(deck ?? null);
          }}
          t={t}
        />
      ) : (
        <section
          className="rounded-xl border border-border bg-surface-muted p-6 text-center"
          aria-labelledby="flashcards-due-heading"
        >
          <h2
            id="flashcards-due-heading"
            className="text-lg font-semibold text-text-primary"
          >
            {t("flashcards.dueToday")}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {t("flashcards.noDue")}
          </p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("flashcards.yourDecks", "Your decks")}
        </h2>
        {courseDecks.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("flashcards.noSubscribedDecks", "No decks yet. Browse community decks and subscribe to get started.")}{" "}
            <Link
              to={langPath("community/explore")}
              className="font-medium text-accent hover:underline"
            >
              {t("flashcards.browseDecks", "Browse decks")}
            </Link>
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courseDecks.map((d) => (
              <li key={d.id}>
                <DeckCard
                  deck={d}
                  onClick={() => {
                    setPreviewAddon(null);
                    setPreviewDeck(d.deck);
                  }}
                  settingsHref={langPath("practice/flashcards/decks")}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("flashcards.communityPacks")}
        </h2>
        {communityPacksWithDecks.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("flashcards.noCommunityPacks")}{" "}
            <Link
              to={langPath("community/explore")}
              className="font-medium text-accent hover:underline"
            >
              {t("flashcards.browseToSubscribe", "Browse decks to subscribe")}
            </Link>
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {communityPacksWithDecks.map(({ addon, deck }) => (
              <li key={addon.id}>
                <CommunityPackCard
                  addon={addon}
                  onClick={() => {
                    setPreviewDeck(deck ?? null);
                    setPreviewAddon(addon);
                  }}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {showPreview && (
        <DeckPreviewModal
          deck={previewDeck}
          addon={previewAddon}
          onClose={() => {
            setPreviewDeck(null);
            setPreviewAddon(null);
          }}
          onSubscriptionChange={handleSubscriptionChange}
        />
      )}
    </div>
  );
}

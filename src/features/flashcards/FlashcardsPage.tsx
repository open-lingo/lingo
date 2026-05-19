import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { Card, WeekSparkline } from "@/shared/components/ui";
import { EmptyState } from "@/shared/components/EmptyState";
import type { Flashcard } from "@/features/flashcards/data/types";
import { useCommunityContent } from "@/features/community/CommunityContentContext";
import { CommunityItemCard } from "@/features/community/components/CommunityItemCard";
import { StudyScopeShortcuts } from "@/features/flashcards/StudyScopeShortcuts";
import { useSubscribedDecks } from "./useSubscribedDecks";
import { useFlashcardDueSummary } from "./useFlashcardDueSummary";

// MOCK: weekly review-volume series — replace with SRS aggregate per day.
const MOCK_WEEK_REVIEWS = [8, 0, 12, 4, 18, 0, 6];
// MOCK: rollups derived from MOCK_WEEK_REVIEWS until SRS exposes a stats endpoint.
const MOCK_WEEK_TOTAL = MOCK_WEEK_REVIEWS.reduce((a, b) => a + b, 0);
// MOCK: card-state buckets — replace with SRS retention query.
const MOCK_LEARNING = 12;
const MOCK_MASTERED = 47;
const MOCK_TOTAL = 59;
// MOCK: per-deck retention until the deck object carries a retention field.
const MOCK_DECK_RETENTION = [82, 76, 91, 70, 88, 73, 85];

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
  t: TFunction;
}) {
  const previewCards = useMemo(() => cards.slice(0, 6), [cards]);
  if (previewCards.length === 0) return null;

  return (
    <Card padding="md" aria-labelledby="flashcards-due-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("flashcards.dueKicker", "Due today")}
          </p>
          <h2
            id="flashcards-due-heading"
            className="mt-1 text-lg font-semibold text-text-primary"
          >
            {t("flashcards.duePeek", "Cards waiting for a review")}
          </h2>
        </div>
        <Link
          to={reviewHref}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          {t("flashcards.review")} {dueCount} {t("flashcards.cards")}
        </Link>
      </div>
      <div className="-mx-1 overflow-x-auto px-1">
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
    </Card>
  );
}

function DeckCard({
  deck,
  retentionPct,
  onClick,
  settingsHref,
  t,
}: {
  deck: { id: string; name: string; cardCount: number; totalCount?: number };
  retentionPct: number;
  onClick: () => void;
  settingsHref?: string;
  t: TFunction;
}) {
  const countLabel =
    deck.totalCount != null && deck.totalCount > deck.cardCount
      ? `${deck.cardCount} / ${deck.totalCount} ${t("flashcards.cards")}`
      : `${deck.cardCount} ${t("flashcards.cards")}`;
  return (
    <div className="relative flex w-full items-center gap-2 rounded-lg border border-border bg-surface p-4 transition hover:border-border-muted hover:shadow">
      {/* MOCK: retentionPct — replace with real per-deck retention. */}
      <span
        className="absolute right-3 top-3 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success"
        aria-label={t("flashcards.retentionLabel", "Retention")}
      >
        {retentionPct}%
      </span>
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-12 text-left"
      >
        <div>
          <h3 className="font-medium text-text-primary">{deck.name}</h3>
          <p className="mt-0.5 text-sm text-text-muted">{countLabel}</p>
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

export function FlashcardsPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";

  const { invalidate } = useSubscribedDecks();

  const handleSubscriptionChange = useMemo(() => invalidate, [invalidate]);

  const {
    dueQueue,
    dueCount,
    deck,
    courseDecks,
    communityPacksWithDecks,
    isLoading: cardsDueLoading,
  } = useFlashcardDueSummary(langId);

  const languageName = getLanguageConfig(langId)?.name ?? langId;

  const { openDeckPreview } = useCommunityContent();

  return (
    <div className="space-y-6">
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

      {/* Zone 1 — Retention summary */}
      <Card padding="lg">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Left col */}
          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("flashcards.retentionKicker", "Flashcards")}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  <Icon name="layers" size={10} aria-hidden />
                  {t("flashcards.retentionPill", "SRS")}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-semibold text-text-primary sm:text-xl">
                {t("flashcards.cardHealthHeadline", "Your card health")}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t(
                  "flashcards.cardHealthSubtitle",
                  "Track due, learning, and mastered cards across every deck you study.",
                )}
              </p>
            </div>
            <div>
              <WeekSparkline
                data={MOCK_WEEK_REVIEWS}
                ariaLabel={t(
                  "flashcards.weekAria",
                  "Cards reviewed this week",
                )}
              />
              <p className="mt-2 text-xs text-text-muted">
                {/* MOCK: MOCK_WEEK_TOTAL — replace with reviews-this-week aggregate. */}
                {t("flashcards.weekCaption", "{{count}} cards this week", {
                  count: MOCK_WEEK_TOTAL,
                })}
              </p>
            </div>
          </div>

          {/* Right col — 4 inset stat boxes */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-xl bg-warning/10 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">
                {t("flashcards.statDue", "Due")}
              </p>
              <p
                className="mt-1 text-2xl font-extrabold leading-none text-warning"
                aria-busy={cardsDueLoading}
              >
                {cardsDueLoading ? "…" : dueCount}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("flashcards.statDueCaption", "Ready to review")}
              </p>
            </div>
            <div className="rounded-xl bg-accent-muted px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                {t("flashcards.statLearning", "Learning")}
              </p>
              {/* MOCK: MOCK_LEARNING — replace with SRS state="learning" count. */}
              <p className="mt-1 text-2xl font-extrabold leading-none text-accent">
                {MOCK_LEARNING}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("flashcards.statLearningCaption", "Still warming up")}
              </p>
            </div>
            <div className="rounded-xl bg-success/10 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-success">
                {t("flashcards.statMastered", "Mastered")}
              </p>
              {/* MOCK: MOCK_MASTERED — replace with SRS state="mastered" count. */}
              <p className="mt-1 text-2xl font-extrabold leading-none text-success">
                {MOCK_MASTERED}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("flashcards.statMasteredCaption", "Long-interval cards")}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("flashcards.statTotal", "Total")}
              </p>
              {/* MOCK: MOCK_TOTAL — replace with subscribed-card count. */}
              <p className="mt-1 text-2xl font-extrabold leading-none text-text-primary">
                {MOCK_TOTAL}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("flashcards.statTotalCaption", "Across all decks")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Zone 2 — Quick study */}
      <Card padding="md">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("flashcards.quickStudyKicker", "Quick study")}
        </p>
        <h2 className="mt-1 text-base font-semibold text-text-primary">
          {t("flashcards.studyShortcuts.title", "Quick study")}
        </h2>
        <p className="mb-3 mt-1 text-xs text-text-muted">
          {t(
            "flashcards.studyShortcuts.hint",
            "Review only certain decks or a saved study option.",
          )}
        </p>
        <StudyScopeShortcuts />
      </Card>

      {/* Zone 3 — Cards due today */}
      {cardsDueLoading ? (
        <Card padding="md" aria-labelledby="flashcards-due-heading">
          <h2
            id="flashcards-due-heading"
            className="text-lg font-semibold text-text-primary"
          >
            {t("flashcards.dueToday")}
          </h2>
          <p className="mt-2 text-sm text-text-secondary" role="status">
            {t("common.loading", "Loading…")}
          </p>
        </Card>
      ) : dueCount > 0 && dueQueue.length > 0 ? (
        <DueCarousel
          cards={dueQueue}
          dueCount={dueCount}
          reviewHref={langPath("practice/flashcards/review")}
          onPreviewDeck={() => {
            openDeckPreview(deck ?? null, null, { onSubscriptionChange: handleSubscriptionChange });
          }}
          t={t}
        />
      ) : (
        <EmptyState
          icon={<Icon name="check" size={20} />}
          title={t("flashcards.noDueTitle", "No cards due right now")}
          description={t(
            "flashcards.noDueDescription",
            "Pick a deck below to study.",
          )}
          action={{
            label: t("flashcards.startFreeReview", "Start free review"),
            to: langPath("practice/flashcards/review"),
          }}
        />
      )}

      {/* Zone 4 — Your decks */}
      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("flashcards.yourDecksKicker", "Library")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            {t("flashcards.yourDecks", "Your decks")}
          </h2>
        </div>
        {courseDecks.length === 0 ? (
          <EmptyState
            icon={<Icon name="decks" size={20} />}
            title={t("flashcards.noDecksTitle", "No subscribed decks yet")}
            description={t(
              "flashcards.noDecksDescription",
              "Subscribe to community decks to start building your review queue.",
            )}
            action={{
              label: t("flashcards.browseCommunityDecks", "Browse community decks"),
              to: langPath("community/explore"),
            }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courseDecks.map((d, idx) => (
              <li key={d.id}>
                <DeckCard
                  deck={d}
                  retentionPct={
                    MOCK_DECK_RETENTION[idx % MOCK_DECK_RETENTION.length]
                  }
                  onClick={() => {
                    openDeckPreview(d.deck, null, { onSubscriptionChange: handleSubscriptionChange });
                  }}
                  settingsHref={langPath("practice/flashcards/decks")}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Zone 5 — Community card packs */}
      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("flashcards.communityKicker", "Community")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            {t("flashcards.communityPacks")}
          </h2>
        </div>
        {communityPacksWithDecks.length === 0 ? (
          <EmptyState
            icon={<Icon name="globe" size={20} />}
            title={t("flashcards.noCommunityPacksTitle", "No community packs yet")}
            description={t(
              "flashcards.noCommunityPacksDescription",
              "Browse community decks to find packs maintained by other learners.",
            )}
            action={{
              label: t("flashcards.browseToSubscribe", "Browse decks to subscribe"),
              to: langPath("community/explore"),
            }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {communityPacksWithDecks.map(({ addon, deck }) => (
              <li key={addon.id}>
                <CommunityItemCard
                  item={{
                    ...addon,
                    deckId: addon.deckId ?? addon.id,
                  }}
                  variant="compact"
                  t={t}
                  langPath={langPath}
                  onPrimaryAction={() => {
                    openDeckPreview(deck ?? null, addon, { onSubscriptionChange: handleSubscriptionChange });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

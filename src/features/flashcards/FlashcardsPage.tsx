import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
import { Card, WeekSparkline, CollapsibleSection } from "@/shared/components/ui";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import type { Flashcard } from "@/features/flashcards/data/types";
import { useCommunityContent } from "@/features/community/CommunityContentContext";
import { CommunityItemCard } from "@/features/community/components/CommunityItemCard";
import { StudyScopeShortcuts } from "@/features/flashcards/StudyScopeShortcuts";
import { StudyOptionsEditor } from "@/features/flashcards/StudyOptionsEditor";
import { useDeckManagerData } from "@/features/flashcards/useDeckManagerData";
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
  isMyVocabDeck,
  isLessonDeck,
  isCommunityStyleDeck,
} from "@/features/flashcards/deckScope";
import { useSubscribedDecks } from "./useSubscribedDecks";
import { useFlashcardDueSummary } from "./useFlashcardDueSummary";


function DueCarousel({
  cards,
  dueCount,
  backlogCount,
  newPerDay,
  reviewHref,
  onPreviewDeck,
  t,
}: {
  cards: Flashcard[];
  dueCount: number;
  backlogCount: number;
  newPerDay: number;
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
          {backlogCount > 0 && (
            <p className="mt-1 text-xs text-text-muted">
              {t("flashcards.backlog", {
                defaultValue: "{{count}} more queued — {{perDay}} new added each day",
                count: backlogCount,
                perDay: newPerDay,
              })}
            </p>
          )}
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

function ReviewScopeCard({
  icon,
  title,
  description,
  count,
  href,
  ctaLabel,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  href: string;
  ctaLabel: string;
  disabled?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-accent-muted p-2 text-accent">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-text-secondary">
          {count}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs font-semibold text-accent">
        {ctaLabel}
        <Icon name="arrowRight" size={14} aria-hidden />
      </div>
    </>
  );

  if (disabled) {
    return (
      <div
        className="flex h-full flex-col rounded-lg border border-border bg-surface-muted/50 p-3 opacity-60"
        aria-disabled
      >
        {body}
      </div>
    );
  }
  return (
    <Link
      to={href}
      className="flex h-full flex-col rounded-lg border border-border bg-surface p-3 transition hover:border-accent hover:bg-surface-muted"
    >
      {body}
    </Link>
  );
}

export function FlashcardsPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const communityOn = isCommunityEnabled(flags);
  const langId = language?.id ?? "ko";

  const { invalidate } = useSubscribedDecks();

  const handleSubscriptionChange = useMemo(() => invalidate, [invalidate]);

  const {
    dueQueue,
    dueCount,
    backlogCount,
    newCardsAllowed,
    totalCount,
    learningCount,
    masteredCount,
    weekReviews,
    deckRetentions,
    deck,
    courseDecks,
    communityPacksWithDecks,
    isLoading: cardsDueLoading,
  } = useFlashcardDueSummary(langId);

  const weekTotal = useMemo(
    () => weekReviews.reduce((a, b) => a + b, 0),
    [weekReviews],
  );

  const { openDeckPreview } = useCommunityContent();

  // Managed decks: used both for the StudyOptionsEditor checklist below and
  // for bucketing the "Review" scope cards (vocab / lessons / subscribed).
  const { decks: managedDecks } = useDeckManagerData(langId);
  const { settings } = useSettings();
  const savedStudyOptionsCount = settings.flashcards?.studyOptions?.length ?? 0;

  const scopeCounts = useMemo(() => {
    let vocab = 0;
    let lessons = 0;
    let subscribed = 0;
    for (const d of managedDecks) {
      if (isMyVocabDeck(d.id)) vocab++;
      else if (isLessonDeck(d)) lessons++;
      else if (isCommunityStyleDeck(d)) subscribed++;
    }
    return { vocab, lessons, subscribed };
  }, [managedDecks]);

  const reviewBase = langPath("practice/flashcards/review");

  return (
    <div className="space-y-6">
      {/* Zone 1 — Retention summary (acts as the page hero; PracticeLayout
          already renders breadcrumbs above us, so we don't repeat an h1). */}
      <Card padding="lg">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <Link
            to={langPath("practice/flashcards/decks")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("flashcards.deckManager.title", "Deck Manager")}
          </Link>
          <Link
            to={langPath("practice/flashcards/cards")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("flashcards.cardManager.title", "Card Manager")}
          </Link>
        </div>
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
                data={weekReviews}
                ariaLabel={t(
                  "flashcards.weekAria",
                  "Cards reviewed this week",
                )}
              />
              <p className="mt-2 text-xs text-text-muted">
                {t("flashcards.weekCaption", "{{count}} cards this week", {
                  count: weekTotal,
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
              <p
                className="mt-1 text-2xl font-extrabold leading-none text-accent"
                aria-busy={cardsDueLoading}
              >
                {cardsDueLoading ? "…" : learningCount}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("flashcards.statLearningCaption", "Still warming up")}
              </p>
            </div>
            <div className="rounded-xl bg-success/10 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-success">
                {t("flashcards.statMastered", "Mastered")}
              </p>
              <p
                className="mt-1 text-2xl font-extrabold leading-none text-success"
                aria-busy={cardsDueLoading}
              >
                {cardsDueLoading ? "…" : masteredCount}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("flashcards.statMasteredCaption", "Long-interval cards")}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("flashcards.statTotal", "Total")}
              </p>
              <p
                className="mt-1 text-2xl font-extrabold leading-none text-text-primary"
                aria-busy={cardsDueLoading}
              >
                {cardsDueLoading ? "…" : totalCount}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("flashcards.statTotalCaption", "Across all decks")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Zone 2 — Quick study (compact: tightened padding + no separate kicker) */}
      <Card padding="sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-primary">
            {t("flashcards.studyShortcuts.title", "Quick study")}
          </h2>
          <p className="text-xs text-text-muted">
            {t(
              "flashcards.studyShortcuts.hint",
              "Review only certain decks or a saved study option.",
            )}
          </p>
        </div>
        <div className="mt-2">
          <StudyScopeShortcuts compact />
        </div>
      </Card>

      {/* Zone 3 — Targeted review (pick a scope) */}
      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("flashcards.reviewKicker", "Review")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            {t("flashcards.targetedReviewTitle", "Targeted review")}
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {t(
              "flashcards.targetedReviewSubtitle",
              "Pick a scope to start a focused review session.",
            )}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReviewScopeCard
            icon={<Icon name="sparkles" size={18} aria-hidden />}
            title={t("flashcards.scope.vocab.title", "My vocab")}
            description={t(
              "flashcards.scope.vocab.description",
              "Cards saved from your personal vocabulary.",
            )}
            count={scopeCounts.vocab}
            href={`${reviewBase}?scope=vocab`}
            ctaLabel={t("flashcards.scope.cta", "Start review")}
            disabled={scopeCounts.vocab === 0}
          />
          <ReviewScopeCard
            icon={<Icon name="graduationCap" size={18} aria-hidden />}
            title={t("flashcards.scope.lessons.title", "Lesson decks")}
            description={t(
              "flashcards.scope.lessons.description",
              "Decks generated from completed lessons.",
            )}
            count={scopeCounts.lessons}
            href={`${reviewBase}?scope=lessons`}
            ctaLabel={t("flashcards.scope.cta", "Start review")}
            disabled={scopeCounts.lessons === 0}
          />
          <ReviewScopeCard
            icon={<Icon name="globe" size={18} aria-hidden />}
            title={t("flashcards.scope.subscribed.title", "Subscribed decks")}
            description={t(
              "flashcards.scope.subscribed.description",
              "Community decks you've subscribed to.",
            )}
            count={scopeCounts.subscribed}
            // No URL preset for "community-only" — pass the deck IDs directly.
            href={
              scopeCounts.subscribed > 0
                ? `${reviewBase}?decks=${encodeURIComponent(
                    managedDecks
                      .filter((d) => isCommunityStyleDeck(d))
                      .map((d) => d.id)
                      .join(","),
                  )}`
                : reviewBase
            }
            ctaLabel={t("flashcards.scope.cta", "Start review")}
            disabled={scopeCounts.subscribed === 0}
          />
        </div>
      </section>

      {/* Zone 4 — Custom study (collapsible) */}
      <CollapsibleSection
        alwaysCollapsible
        persistKey="flashcards-custom-study"
        title={t("flashcards.customStudy.title", "Custom study")}
        trailing={
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
            {t("flashcards.customStudy.count", "{{count}} saved", {
              count: savedStudyOptionsCount,
            })}
          </span>
        }
      >
        <div className="rounded-lg border border-border bg-surface p-3">
          <StudyOptionsEditor decks={managedDecks} />
        </div>
      </CollapsibleSection>

      {/* Zone 5 — Cards due today */}
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
          backlogCount={backlogCount}
          newPerDay={newCardsAllowed}
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
          action={
            <Link
              to={`${langPath("practice/flashcards/review")}?free=1`}
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              {t("flashcards.startFreeReview", "Start a free review")}
            </Link>
          }
        />
      )}

      {/* Zone 6 — Your decks */}
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
            action={
              communityOn ? (
                <Link
                  to={langPath("community/explore")}
                  className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  {t("flashcards.browseCommunityDecks", "Browse community decks")}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courseDecks.map((d, idx) => (
              <li key={d.id}>
                <DeckCard
                  deck={d}
                  retentionPct={deckRetentions[idx] ?? 0}
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

      {/* Zone 7 — Community card packs. With the community flag off the empty
          state is a pure funnel into community/explore, so the whole section
          hides; already-subscribed packs stay (they still review locally). */}
      {!communityOn && communityPacksWithDecks.length === 0 ? null : (
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
            action={
              communityOn ? (
                <Link
                  to={langPath("community/explore")}
                  className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  {t("flashcards.browseToSubscribe", "Browse decks to subscribe")}
                </Link>
              ) : undefined
            }
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
      )}
    </div>
  );
}

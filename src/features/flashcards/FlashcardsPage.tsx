import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
import { Card } from "@/shared/components/ui";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import type { Flashcard } from "@/features/flashcards/data/types";
import { useCommunityContent } from "@/features/community/CommunityContentContext";
import { CommunityItemCard } from "@/features/community/components/CommunityItemCard";
import { useDeckManagerData } from "@/features/flashcards/useDeckManagerData";
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
      <div className="scrollbar-pill -mx-1 overflow-x-auto px-1">
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
    deck,
    communityPacksWithDecks,
    isLoading: cardsDueLoading,
  } = useFlashcardDueSummary(langId);

  const weekTotal = useMemo(
    () => weekReviews.reduce((a, b) => a + b, 0),
    [weekReviews],
  );

  const { openDeckPreview } = useCommunityContent();

  // Managed decks: used for bucketing the "Review" scope cards
  // (vocab / lessons / subscribed).
  const { decks: managedDecks } = useDeckManagerData(langId);

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
      {/* Zone 1 — Compact card-health strip (acts as the page hero;
          PracticeLayout already renders breadcrumbs above us, so no h1). */}
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("flashcards.retentionKicker", "Flashcards")}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-accent">
              <Icon name="layers" size={10} aria-hidden />
              {t("flashcards.retentionPill", "SRS")}
            </span>
            <span className="text-xs text-text-muted">
              {t("flashcards.weekCaption", "{{count}} cards this week", {
                count: weekTotal,
              })}
            </span>
          </div>
          <Link
            to={langPath("vocab")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            {t("flashcards.vocabBrowserLink", "Browse your vocabulary")}
            <Icon name="arrowRight" size={14} aria-hidden />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { key: "due", label: t("flashcards.statDue", "Due"), value: dueCount, box: "bg-warning/10", text: "text-warning" },
              { key: "learning", label: t("flashcards.statLearning", "Learning"), value: learningCount, box: "bg-accent-muted", text: "text-accent" },
              { key: "mastered", label: t("flashcards.statMastered", "Mastered"), value: masteredCount, box: "bg-success/10", text: "text-success" },
              { key: "total", label: t("flashcards.statTotal", "Total"), value: totalCount, box: "bg-surface-muted", text: "text-text-primary" },
            ] as const
          ).map((s) => (
            <div key={s.key} className={`flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 ${s.box}`}>
              <p className={`text-[0.625rem] font-semibold uppercase tracking-wider ${s.text}`}>
                {s.label}
              </p>
              <p className={`text-xl font-bold leading-none tabular-nums ${s.text}`} aria-busy={cardsDueLoading}>
                {cardsDueLoading ? "…" : s.value}
              </p>
            </div>
          ))}
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
        <div
          className={`grid gap-3 ${communityOn ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
        >
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
          {/* Subscribed (community) decks — hidden until the community
              surface ships, since there are no community decks to subscribe
              to yet. */}
          {communityOn ? (
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
          ) : null}
        </div>
      </section>

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


      {/* Zone 7 — Community card packs. Gated entirely behind the community
          flag: community decks don't exist yet, so the whole surface (empty
          state and any locally-subscribed packs) stays hidden until it ships.
          Subscribed packs still review locally via the review queue. */}
      {communityOn && (
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

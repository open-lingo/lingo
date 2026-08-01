import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { useApi } from "@/shared/api/provider";
import { useToast } from "@/shared/contexts/ToastContext";
import { useSubscriptions } from "@/features/flashcards/useSubscriptions";
import { Icon } from "@/shared/components/Icon";
import { Modal } from "@/shared/components/ui/Modal";
import { computeDeckStats } from "@/features/flashcards/deckStats";
import {
  DeckPreviewHeader,
  type DeckPreviewAuthor,
} from "@/features/flashcards/components/DeckPreviewHeader";
import { DeckStatsPanel } from "@/features/flashcards/components/DeckStatsPanel";
import { CardCarousel } from "@/features/flashcards/components/CardCarousel";
import { SubscribeButton } from "@/features/flashcards/components/SubscribeButton";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "@/features/community/types";
import { useDateFormat } from "@/shared/utils/formatDate";

type DeckPreviewModalProps = {
  deck: FlashcardDeck | null;
  addon: CommunityAddon | null;
  /** Resolved author (name + avatar) when the caller has directory data. */
  author?: DeckPreviewAuthor;
  /** Caller-supplied upvote count (e.g. from the marketplace item). */
  upvoteCount?: number;
  onClose: () => void;
  onSubscriptionChange?: () => void;
};

export function DeckPreviewModal({
  deck,
  addon,
  author,
  upvoteCount,
  onClose,
  onSubscriptionChange,
}: DeckPreviewModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { formatDateOnly } = useDateFormat();
  const { users: usersApi } = useApi();
  const { subscriptions, isLoading: subsQueryLoading } = useSubscriptions();
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  const deckId = deck?.id ?? addon?.deckId ?? addon?.id ?? "";
  const isCourseDeck = Boolean(deck?.courseId);
  const canSubscribe = Boolean(deckId) && !isCourseDeck;

  const subscriptionsLoading = canSubscribe ? subsQueryLoading : false;
  const isSubscribed =
    canSubscribe && subscriptions.some((s) => s.contentId === deckId);

  // Both handlers had `.then().finally()` and no `.catch`: a failed
  // subscribe/unsubscribe spun the button, snapped it back unchanged, and
  // surfaced only as an unhandled rejection in the console. The learner is
  // left thinking the click didn't register.
  const handleSubscribe = useCallback(() => {
    if (!canSubscribe) return;
    setSubscribeLoading(true);
    usersApi
      .addSubscription({ contentType: "deck", contentId: deckId })
      .then(() => onSubscriptionChange?.())
      .catch(() =>
        showToast(
          t("decks.subscribeFailed", {
            defaultValue: "Couldn't subscribe to that deck — try again.",
          }),
          "error",
        ),
      )
      .finally(() => setSubscribeLoading(false));
  }, [usersApi, deckId, canSubscribe, onSubscriptionChange, showToast, t]);

  const handleUnsubscribe = useCallback(() => {
    if (!canSubscribe) return;
    setSubscribeLoading(true);
    usersApi
      .removeSubscription("deck", deckId)
      .then(() => onSubscriptionChange?.())
      .catch(() =>
        showToast(
          t("decks.unsubscribeFailed", {
            defaultValue: "Couldn't unsubscribe from that deck — try again.",
          }),
          "error",
        ),
      )
      .finally(() => setSubscribeLoading(false));
  }, [usersApi, deckId, canSubscribe, onSubscriptionChange, showToast, t]);

  const cards = deck?.cards ?? [];
  const hasCards = cards.length > 0;

  const stats = useMemo(() => computeDeckStats(cards), [cards]);

  const title = deck?.name ?? addon?.name ?? "";
  const description = addon?.description ?? "";
  const cardCount = deck?.cards.length ?? addon?.itemCount ?? 0;
  const coverUrl = getDeckImageUrl(deckId, deck?.image ?? addon?.image);

  const languageId = deck?.languageId ?? addon?.languageId ?? "";
  const langConfig = getLanguageConfig(languageId);
  const languageName = langConfig?.name ?? (languageId || "—");

  const resolvedAuthor: DeckPreviewAuthor | undefined =
    author ?? (addon?.maintainerName ? { displayName: addon.maintainerName } : undefined);

  const fallbackUpvotes = upvoteCount ?? addon?.upvoteCount ?? 0;
  const updatedDate = addon?.updatedAt ? formatDateOnly(addon.updatedAt) : null;

  return (
    <Modal
      open
      onClose={onClose}
      size="2xl"
      unpadded
      showCloseButton
      ariaLabelledBy="deck-preview-title"
    >
      <div className="flex flex-col">
        <div className="px-5 pt-2 sm:px-6">
          <DeckPreviewHeader
            title={title}
            coverUrl={coverUrl}
            languageName={languageName}
            languageFlag={langConfig?.flag}
            author={resolvedAuthor}
            deckId={canSubscribe ? deckId : undefined}
            fallbackUpvotes={fallbackUpvotes}
            showVotes={!isCourseDeck}
          />
        </div>

        {description && (
          <p className="px-5 text-sm leading-relaxed text-text-secondary sm:px-6">
            {description}
          </p>
        )}

        {/* Stats — card count + complexity + difficulty */}
        <div className="mt-4 border-t border-border px-5 py-4 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="layers" size={15} aria-hidden />
              <span className="font-medium text-text-primary tabular-nums">
                {cardCount}
              </span>
              {t("flashcards.cards", "cards")}
            </span>
            {updatedDate && (
              <span className="inline-flex items-center gap-1.5 text-text-muted">
                <Icon name="clock" size={15} aria-hidden />
                {t("flashcards.updated", { date: updatedDate })}
              </span>
            )}
          </div>
          {hasCards ? (
            <DeckStatsPanel stats={stats} />
          ) : (
            <p className="text-xs text-text-muted">
              {t(
                "flashcards.statsUnavailable",
                "Detailed stats unavailable for this pack.",
              )}
            </p>
          )}
        </div>

        {/* Real SRS card preview */}
        <div className="border-t border-border px-5 py-4 sm:px-6">
          <h3 className="mb-3 text-sm font-medium text-text-primary">
            {t("flashcards.cardPreview", "Card preview")}
          </h3>
          {hasCards ? (
            <CardCarousel cards={cards} languageId={languageId} />
          ) : (
            <p className="text-sm text-text-muted">
              {t(
                "flashcards.previewNoCards",
                "Card preview not available for this pack.",
              )}
            </p>
          )}
        </div>

        {/* Subscribe — the one great action */}
        {canSubscribe && !subscriptionsLoading && (
          <div className="sticky bottom-0 border-t border-border bg-surface px-5 py-4 sm:px-6">
            <SubscribeButton
              isSubscribed={isSubscribed}
              loading={subscribeLoading}
              onSubscribe={handleSubscribe}
              onUnsubscribe={handleUnsubscribe}
            />
            <p className="mt-2 text-center text-xs text-text-muted">
              {isSubscribed
                ? t(
                    "flashcards.subscribedHint",
                    "Review these cards from your flashcards practice.",
                  )
                : t(
                    "flashcards.subscribeHint",
                    "Subscribe to add this deck to your reviews.",
                  )}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { useApi } from "@/shared/api/provider";
import { useSubscriptions } from "@/features/flashcards/useSubscriptions";
import { Icon } from "@/shared/components/Icon";
import { ModalBackdrop } from "@/shared/components/ModalBackdrop";
import { PlainText } from "@/shared/components/PlainText";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/components/ui/cn";
import type { Flashcard, FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "@/features/community/types";
import { useDateFormat } from "@/shared/utils/formatDate";

function cardMatchesSearch(card: Flashcard, q: string): boolean {
  const trimmed = q.trim();
  if (!trimmed) return true;
  const searchable = [
    card.front,
    card.back,
    card.note,
    card.reasoning,
    card.type === "other" ? card.definition : undefined,
    card.type === "other" ? card.context : undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const words = trimmed.toLowerCase().split(/\s+/);
  return words.every((word) => searchable.includes(word));
}

type DeckPreviewModalProps = {
  deck: FlashcardDeck | null;
  addon: CommunityAddon | null;
  onClose: () => void;
  onSubscriptionChange?: () => void;
};

export function DeckPreviewModal({
  deck,
  addon,
  onClose,
  onSubscriptionChange,
}: DeckPreviewModalProps) {
  const { t } = useTranslation();
  const { formatDateOnly } = useDateFormat();
  const langPath = useLangPath();
  const { users: usersApi } = useApi();
  const { subscriptions, isLoading: subsQueryLoading } = useSubscriptions();
  const [search, setSearch] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  const deckId = deck?.id ?? addon?.deckId ?? addon?.id ?? "";
  const isCourseDeck = Boolean(deck?.courseId);

  const subscriptionsLoading =
    deckId && !isCourseDeck ? subsQueryLoading : false;
  const isSubscribed =
    Boolean(deckId && !isCourseDeck) &&
    subscriptions.some((s) => s.contentId === deckId);

  const handleSubscribe = useCallback(() => {
    if (!deckId || isCourseDeck) return;
    setSubscribeLoading(true);
    usersApi
      .addSubscription({ contentType: "deck", contentId: deckId })
      .then(() => onSubscriptionChange?.())
      .finally(() => setSubscribeLoading(false));
  }, [usersApi, deckId, isCourseDeck, onSubscriptionChange]);

  const handleUnsubscribe = useCallback(() => {
    if (!deckId || isCourseDeck) return;
    setSubscribeLoading(true);
    usersApi
      .removeSubscription("deck", deckId)
      .then(() => onSubscriptionChange?.())
      .finally(() => setSubscribeLoading(false));
  }, [usersApi, deckId, isCourseDeck, onSubscriptionChange]);

  const reviewHref = langPath("practice/flashcards/review");
  const hasCards = deck != null && deck.cards.length > 0;

  const filteredCards = useMemo(() => {
    if (!deck?.cards) return [];
    if (!search.trim()) return deck.cards;
    return deck.cards.filter((c) => cardMatchesSearch(c, search));
  }, [deck?.cards, search]);

  const title = deck?.name ?? addon?.name ?? "";
  const cardCount = deck?.cards.length ?? addon?.itemCount ?? 0;
  const coverUrl = getDeckImageUrl(
    deck?.id ?? addon?.deckId ?? addon?.id ?? "",
    deck?.image ?? addon?.image,
  );

  const languageId = deck?.languageId ?? addon?.languageId ?? "";
  const languageName =
    getLanguageConfig(languageId)?.name ?? (languageId || "—");
  const creatorName = addon?.maintainerIds?.length
    ? t("flashcards.byCreator", { name: "User" })
    : deck?.courseId
      ? t("flashcards.creatorCourse")
      : t("flashcards.creatorUnknown");
  const updatedDate = addon?.updatedAt
    ? t("flashcards.updated", { date: formatDateOnly(addon.updatedAt) })
    : null;
  const upvoteCount = addon?.upvoteCount ?? 0;

  return (
    <ModalBackdrop onClose={onClose} ariaLabelledBy="deck-preview-title">
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg border border-border bg-surface/95 p-2 text-text-primary shadow-sm backdrop-blur-sm transition hover:bg-surface-muted"
          aria-label={t("flashcards.close")}
        >
          <Icon name="close" size={20} />
        </button>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto">
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-40 w-full object-cover sm:h-48"
            />
            <div className="px-6 py-4">
              <h2 id="deck-preview-title" className="text-xl font-semibold text-text-primary">
                {title}
              </h2>
              {addon?.description && (
                <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                  {addon.description}
                </p>
              )}
            </div>

            <div className="border-t border-border px-6 py-3">
              <h3 className="mb-2 text-sm font-medium text-text-primary">
                {t("flashcards.cardPreview")}
              </h3>
              {hasCards ? (
                <>
                  <label htmlFor="deck-preview-search" className="sr-only">
                    {t("flashcards.searchPlaceholder")}
                  </label>
                  <input
                    id="deck-preview-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("flashcards.searchPlaceholder")}
                    className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                  />
                </>
              ) : (
                <p className="text-sm text-text-muted">{t("flashcards.previewNoCards")}</p>
              )}
            </div>

            {hasCards && (
              <div className="px-6 pb-4">
                {filteredCards.length === 0 ? (
                  <p className="py-8 text-center text-sm text-text-muted">
                    {t("flashcards.searchNoResults")}
                  </p>
                ) : (
                  <ul className="space-y-2" role="list">
                    {filteredCards.map((card) => (
                      <li
                        key={card.id}
                        className="rounded-lg border border-border bg-surface-muted px-4 py-3"
                      >
                        <div className="font-medium text-text-primary [&>*]:my-0">
                          <PlainText>{card.front}</PlainText>
                        </div>
                        <div className="mt-0.5 text-sm text-text-secondary [&>*]:my-0">
                          <PlainText>{card.back}</PlainText>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="border-t border-border px-6 py-4">
              <h3 className="text-sm font-medium text-text-primary">Comments</h3>
              <p className="mt-1 text-sm text-text-muted">
                {t("flashcards.commentsComingSoon")}
              </p>
            </div>
          </div>

          <aside className="flex w-48 shrink-0 flex-col gap-4 border-l border-border bg-surface-muted/50 px-4 py-4">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {creatorName}
              </p>
              {updatedDate && (
                <p className="text-sm text-text-secondary">{updatedDate}</p>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("flashcards.language")}
                </p>
                <p className="text-sm text-text-primary">{languageName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("flashcards.cards")}
                </p>
                <p className="text-sm text-text-primary">{cardCount}</p>
              </div>
              {addon && upvoteCount >= 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    {t("flashcards.upvotesLabel")}
                  </p>
                  <p className="text-sm text-text-primary">
                    <Icon name="chevronUp" size={14} className="inline" /> {upvoteCount}
                  </p>
                </div>
              )}
              {(deck?.locale ?? addon?.locale) && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    {t("flashcards.locale")}
                  </p>
                  <p className="text-sm text-text-primary">
                    {deck?.locale ?? addon?.locale}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
          {!isCourseDeck && deckId && !subscriptionsLoading && (
            <Button
              type="button"
              variant="outline"
              disabled={subscribeLoading}
              onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              className={cn(
                isSubscribed &&
                  "border-success/60 bg-success/10 text-success hover:bg-success/15",
              )}
            >
              {subscribeLoading
                ? "…"
                : isSubscribed
                  ? t("flashcards.subscribed")
                  : t("flashcards.subscribe")}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            {t("flashcards.close")}
          </Button>
          <Link
            to={reviewHref}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            {t("flashcards.startReview")}
          </Link>
        </div>
      </div>
    </ModalBackdrop>
  );
}

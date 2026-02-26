import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { useApi } from "@/shared/api/provider";
import { useSubscriptions } from "@/features/flashcards/useSubscriptions";
import { Icon } from "@/shared/components/Icon";
import { PlainText } from "@/shared/components/PlainText";
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const title = deck?.name ?? addon?.name ?? "";
  const cardCount = deck?.cards.length ?? addon?.itemCount ?? 0;
  const coverUrl = getDeckImageUrl(
    deck?.id ?? addon?.deckId ?? addon?.id ?? "",
    deck?.image ?? addon?.image
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-preview-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
          aria-label={t("flashcards.close")}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Main: Content | Sidebar (sidebar beside image, name, AND cards) */}
        <div className="flex min-h-0 flex-1">
          {/* Left: image, name, card preview, comments */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <img
              src={coverUrl}
              alt=""
              className="h-40 w-full object-cover sm:h-48"
            />
            <div className="px-6 py-4">
              <h2
                id="deck-preview-title"
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
              {addon?.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {addon.description}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  />
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("flashcards.previewNoCards")}
                </p>
              )}
            </div>

            {hasCards && (
              <div className="px-6 pb-4">
                {filteredCards.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t("flashcards.searchNoResults")}
                  </p>
                ) : (
                  <ul className="space-y-2" role="list">
                    {filteredCards.map((card) => (
                      <li
                        key={card.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 dark:border-gray-600 dark:bg-gray-700/50"
                      >
                        <div className="font-medium text-gray-900 dark:text-white [&>*]:my-0">
                          <PlainText>{card.front}</PlainText>
                        </div>
                        <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 [&>*]:my-0">
                          <PlainText>{card.back}</PlainText>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Comments
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("flashcards.commentsComingSoon")}
              </p>
            </div>
          </div>

          {/* Right: sidebar metadata - full height beside content */}
          <aside className="flex w-48 shrink-0 flex-col gap-4 border-l border-gray-200 bg-gray-50/50 px-4 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {creatorName}
              </p>
              {updatedDate && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {updatedDate}
                </p>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("flashcards.language")}
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {languageName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("flashcards.cards")}
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {cardCount}
                </p>
              </div>
              {addon && upvoteCount >= 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t("flashcards.upvotesLabel")}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <Icon name="chevronUp" size={14} className="inline" /> {upvoteCount}
                  </p>
                </div>
              )}
              {(deck?.locale ?? addon?.locale) && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t("flashcards.locale")}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {deck?.locale ?? addon?.locale}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {!isCourseDeck && deckId && !subscriptionsLoading && (
            <button
              type="button"
              disabled={subscribeLoading}
              onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                isSubscribed
                  ? "border border-green-600 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-900/30 dark:text-green-400"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {subscribeLoading ? "…" : isSubscribed ? t("flashcards.subscribed") : t("flashcards.subscribe")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("flashcards.close")}
          </button>
          <Link
            to={reviewHref}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {t("flashcards.startReview")}
          </Link>
        </div>
      </div>
    </div>
  );
}

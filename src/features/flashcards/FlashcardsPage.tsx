import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckForLanguage, getDeckForPractice } from "@/features/flashcards/data/loadDeck";
import { getMockCompletedLessonIds } from "@/features/course/mockProgress";
import { getAllAddons } from "@/features/community/mockCommunity";
import { countCardsDue } from "./engine";
import { DeckPreviewModal } from "./DeckPreviewModal";
import type { Flashcard, FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "@/features/community/types";

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
      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      aria-labelledby="flashcards-due-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="flashcards-due-heading"
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          {t("flashcards.dueToday")}
        </h2>
        <Link
          to={reviewHref}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
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
                className="flex h-32 w-full flex-col justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-gray-500 dark:hover:bg-gray-700"
              >
                <p className="line-clamp-3 text-base font-medium text-gray-900 dark:text-white">
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
  t,
}: {
  deck: { id: string; name: string; cardCount: number; totalCount?: number };
  onClick: () => void;
  t: (k: string) => string;
}) {
  const countLabel =
    deck.totalCount != null && deck.totalCount > deck.cardCount
      ? `${deck.cardCount} / ${deck.totalCount} ${t("flashcards.cards")}`
      : `${deck.cardCount} ${t("flashcards.cards")}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{deck.name}</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {countLabel}
        </p>
      </div>
      <span className="ml-2 shrink-0 text-green-600 dark:text-green-400">→</span>
    </button>
  );
}

function CommunityPackCard({
  addon,
  onClick,
  t,
  getLanguageConfig,
}: {
  addon: CommunityAddon;
  onClick: () => void;
  t: (k: string) => string;
  getLanguageConfig: (id: string) => { name: string; flag: string } | undefined;
}) {
  const lang = getLanguageConfig(addon.languageId);
  const langName = lang?.name ?? addon.languageId;
  const flag = lang?.flag ?? "🌐";

  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <span className="text-2xl" role="img" aria-label={langName}>
        {flag}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{addon.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {addon.description}
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {addon.itemCount ?? "—"} {t("flashcards.cards")} · ↑ {addon.upvoteCount}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
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

  const completedLessonIds = getMockCompletedLessonIds();
  const rawDeck = getDeckForLanguage(langId);
  const practiceDeck = getDeckForPractice(langId, completedLessonIds);
  const deck = practiceDeck ?? rawDeck;
  const cards = deck?.cards ?? [];
  const dueCount = countCardsDue(cards);

  const courseDecks = useMemo(() => {
    if (!deck) return [];
    const unlocked = deck.cards.length;
    const total = rawDeck?.courseId ? rawDeck.cards.length : unlocked;
    return [
      {
        id: deck.id,
        name: deck.name,
        cardCount: unlocked,
        totalCount: total > unlocked ? total : undefined,
      },
    ];
  }, [deck, rawDeck]);

  const communityPacks = useMemo(
    () =>
      getAllAddons().filter(
        (a): a is CommunityAddon => a.kind === "flashcard-pack"
      ),
    []
  );

  const languageName = getLanguageConfig(langId)?.name ?? langId;

  const [previewDeck, setPreviewDeck] = useState<FlashcardDeck | null>(null);
  const [previewAddon, setPreviewAddon] = useState<CommunityAddon | null>(null);
  const showPreview = previewDeck != null || previewAddon != null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("flashcards.title")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {t("flashcards.subtitle", { language: languageName })}
        </p>
      </div>

      {dueCount > 0 && cards.length > 0 ? (
        <DueCarousel
          cards={cards}
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
          className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50"
          aria-labelledby="flashcards-due-heading"
        >
          <h2
            id="flashcards-due-heading"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {t("flashcards.dueToday")}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("flashcards.noDue")}
          </p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("flashcards.courseDecks")}
        </h2>
        {courseDecks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("flashcards.noCourseDecks", { language: languageName })}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courseDecks.map((d) => (
              <li key={d.id}>
                <DeckCard
                  deck={d}
                  onClick={() => {
                    setPreviewAddon(null);
                    setPreviewDeck(deck ?? null);
                  }}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("flashcards.communityPacks")}
        </h2>
        {communityPacks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("flashcards.noCommunityPacks")}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {communityPacks.map((addon) => (
              <li key={addon.id}>
                <CommunityPackCard
                  addon={addon}
                  onClick={() => {
                    setPreviewDeck(null);
                    setPreviewAddon(addon);
                  }}
                  t={t}
                  getLanguageConfig={getLanguageConfig}
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
        />
      )}
    </div>
  );
}

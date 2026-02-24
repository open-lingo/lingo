import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useApi } from "@/shared/api/provider";
import { parseStoryBody } from "@/features/community/contribute/parseStoryEmbeds";
import type { StoryResponse } from "@/shared/api/stories";
import type { DeckCard } from "@/shared/api/decks";

export function StoryDetailPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { storyId } = useParams<{ storyId: string }>();
  const { language } = useLanguage();
  const { stories: storiesApi, decks: decksApi } = useApi();

  const [apiStory, setApiStory] = useState<StoryResponse | null | undefined>(
    undefined
  );
  const [companionCards, setCompanionCards] = useState<
    Map<string, DeckCard>
  >(new Map());
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const story = apiStory;

  useEffect(() => {
    if (!storyId) return;
    let ok = true;
    storiesApi
      .getStory(storyId)
      .then((s) => {
        if (ok) setApiStory(s);
      })
      .catch(() => {
        if (ok) setApiStory(null);
      });
    return () => {
      ok = false;
    };
  }, [storyId, storiesApi]);

  useEffect(() => {
    if (!story?.companionDeckId) return;
    let ok = true;
    decksApi
      .getDeck(story.companionDeckId)
      .then((deck) => {
        if (ok && deck.cards) {
          const map = new Map<string, DeckCard>();
          for (const c of deck.cards) {
            map.set(c.id, c);
          }
          setCompanionCards(map);
        }
      })
      .catch(() => {
        if (ok) setCompanionCards(new Map());
      });
    return () => {
      ok = false;
    };
  }, [story?.companionDeckId, decksApi]);

  const handleAddToVocab = useCallback(
    async (card: DeckCard) => {
      if (!language?.id) return;
      setAddLoading(card.id);
      try {
        const vocabDeck = await decksApi.getMyVocabDeck(language.id);
        await decksApi.addCardsToDeck(vocabDeck.id, [card]);
        setAddedIds((prev) => new Set([...prev, card.id]));
      } catch {
        /* show toast in future */
      } finally {
        setAddLoading(null);
      }
    },
    [language?.id, decksApi]
  );

  if (apiStory === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-gray-500 dark:text-gray-400">
          {t("stories.storyNotFound")}
        </p>
        <Link
          to={langPath("practice/stories")}
          className="text-sm text-green-600 dark:text-green-400"
        >
          {t("stories.back")}
        </Link>
      </div>
    );
  }

  const segments = parseStoryBody(story.body ?? "");
  const hasBody = Boolean(story.body);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={langPath("practice/stories")}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("stories.back")}
        </Link>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {story.title}
          </h1>
          {story.description && (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {story.description}
            </p>
          )}
          <div className="mt-2 flex gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{t("stories.communityStories")}</span>
          </div>
        </header>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {hasBody && segments.length > 0 ? (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {segments.map((seg, i) => {
                if (seg.type === "text") {
                  return <span key={i}>{seg.text}</span>;
                }
                const card = companionCards.get(seg.cardId);
                const isActive = activeCardId === seg.cardId;
                const isAdded = addedIds.has(seg.cardId);
                return (
                  <span key={i} className="relative inline">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCardId(isActive ? null : seg.cardId)
                      }
                      className={`cursor-pointer border-b border-dashed border-green-500/70 bg-green-500/10 px-0.5 py-0 text-inherit hover:bg-green-500/20 dark:border-green-400/70 dark:bg-green-500/20 dark:hover:bg-green-500/30 ${
                        isActive ? "bg-green-500/25 dark:bg-green-500/40" : ""
                      }`}
                    >
                      {seg.display}
                    </button>
                    {isActive && card && (
                      <span
                        className="absolute left-0 top-full z-10 mt-1 flex max-w-xs flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                        role="tooltip"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {card.front}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {card.back}
                        </span>
                        {language?.id && (
                          <button
                            type="button"
                            disabled={addLoading === card.id || isAdded}
                            onClick={() => handleAddToVocab(card)}
                            className="self-start rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                          >
                            {addLoading === card.id
                              ? "…"
                              : isAdded
                                ? t("practice.addedToDeck")
                                : t("practice.addToDeck")}
                          </button>
                        )}
                      </span>
                    )}
                    {isActive && !card && (
                      <span
                        className="absolute left-0 top-full z-10 mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                        role="tooltip"
                      >
                        {t("stories.cardNotFound")}
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              {t("stories.contentPlaceholder")}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

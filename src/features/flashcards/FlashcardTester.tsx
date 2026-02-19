import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getDeckForPractice, getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import { getMockCompletedLessonIds } from "@/features/course/mockProgress";
import { buildReviewQueue, reviewCard, setCardState, getEffectiveState, shouldRepeatInSession } from "./engine";
import type { Flashcard, CardSegment, SRSRating } from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

function getParticleById(particles: ParticleDef[] | null, id: string): ParticleDef | undefined {
  return particles?.find((p) => p.id === id);
}

function HighlightedText({
  segments,
  particles,
  highlightMode,
}: {
  segments: CardSegment[];
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  if (!segments?.length) return null;
  return (
    <span>
      {segments.map((seg, i) => {
        const particle = seg.particleId ? getParticleById(particles, seg.particleId) : undefined;
        const isParticle = Boolean(seg.particleId && particle);
        const isRoot = Boolean(highlightMode && seg.meaning && !seg.particleId);
        if (highlightMode && isParticle) {
          return (
            <mark
              key={i}
              className="rounded bg-amber-200 px-0.5 dark:bg-amber-800"
              title={particle ? `${particle.form}: ${particle.meaning}` : undefined}
            >
              {seg.segment}
            </mark>
          );
        }
        if (isRoot) {
          return (
            <mark
              key={i}
              className="rounded bg-emerald-200 px-0.5 dark:bg-emerald-800"
              title={seg.meaning}
            >
              {seg.segment}
            </mark>
          );
        }
        return <span key={i}>{seg.segment}</span>;
      })}
    </span>
  );
}

function CardFace({
  card,
  side,
  particles,
  highlightMode,
}: {
  card: Flashcard;
  side: "front" | "back";
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  const isFront = side === "front";
  if (isFront) {
    if (highlightMode && card.type === "word" && card.parts?.length) {
      return <HighlightedText segments={card.parts} particles={particles} highlightMode />;
    }
    if (highlightMode && card.type === "sentence" && card.words?.length) {
      return <HighlightedText segments={card.words} particles={particles} highlightMode />;
    }
    return <>{card.front}</>;
  }
  return <>{card.back}</>;
}

const RATING_BUTTONS: Array<{ rating: SRSRating; label: string; color: string }> = [
  {
    rating: "again",
    label: "Again",
    color: "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600",
  },
  {
    rating: "hard",
    label: "Hard",
    color: "bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-400 dark:hover:bg-orange-500",
  },
  {
    rating: "good",
    label: "Good",
    color: "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600",
  },
  {
    rating: "easy",
    label: "Easy",
    color: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
  },
];

function IntervalHint({ cardId, rating }: { cardId: string; rating: SRSRating }) {
  const state = getEffectiveState(cardId);
  const next = reviewCard(state, rating);
  if (next.interval === 0) return <span className="text-[10px]">&lt;1d</span>;
  if (next.interval === 1) return <span className="text-[10px]">1d</span>;
  if (next.interval < 30) return <span className="text-[10px]">{next.interval}d</span>;
  const months = Math.round(next.interval / 30);
  return <span className="text-[10px]">{months}mo</span>;
}

export function FlashcardTester() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const languageId = language?.id ?? "en";
  const completedLessonIds = getMockCompletedLessonIds();
  const deck = getDeckForPractice(languageId, completedLessonIds);
  const particlesData = getParticlesForLanguage(languageId);
  const particles = particlesData?.particles ?? null;

  const [queueVersion, setQueueVersion] = useState(0);

  const queue = useMemo(
    () => (deck ? buildReviewQueue(deck.cards) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, queueVersion],
  );

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [highlightMode, setHighlightMode] = useState(true);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  // SM-2 step 7: cards scoring < 4 are appended for re-review within the session
  const [repeatCards, setRepeatCards] = useState<Flashcard[]>([]);

  const allCards = useMemo(() => {
    const base = queue?.queue ?? [];
    return [...base, ...repeatCards];
  }, [queue, repeatCards]);

  const card: Flashcard | undefined = allCards[index];
  const isSessionDone = !card;

  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!card) return;
      const current = getEffectiveState(card.id);
      const next = reviewCard(current, rating);
      setCardState(card.id, next);

      // SM-2 step 7: if quality < 4, re-show at end of session
      if (shouldRepeatInSession(rating)) {
        setRepeatCards((prev) => [...prev, card]);
      }

      setSessionStats((s) => ({
        reviewed: s.reviewed + 1,
        correct: rating !== "again" ? s.correct + 1 : s.correct,
      }));

      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [card],
  );

  const handleRestart = useCallback(() => {
    setIndex(0);
    setFlipped(false);
    setRepeatCards([]);
    setSessionStats({ reviewed: 0, correct: 0 });
    setQueueVersion((v) => v + 1);
  }, []);

  if (!deck) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No flashcard deck for this language yet. Select Korean in the language selector to try the sample deck.
      </p>
    );
  }

  if (isSessionDone) {
    const accuracy =
      sessionStats.reviewed > 0
        ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
        : 100;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("flashcards.sessionDone", "Review Complete!")}
        </h2>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {sessionStats.reviewed}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("flashcards.reviewed", "Reviewed")}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {accuracy}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("flashcards.accuracy", "Accuracy")}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {t("flashcards.reviewMore", "Review More")}
          </button>
          <Link
            to={langPath("practice/flashcards")}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("flashcards.backToHub")}
          </Link>
        </div>
      </div>
    );
  }

  // TS narrowing: card is guaranteed defined after isSessionDone guard
  const currentCard = card!;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to={langPath("practice/flashcards")}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("flashcards.backToHub")}
        </Link>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {index + 1} / {allCards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${allCards.length > 0 ? Math.round((index / allCards.length) * 100) : 0}%` }}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={highlightMode}
            onChange={(e) => setHighlightMode(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Highlight particles & roots
        </label>
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border-2 border-gray-300 bg-white py-12 shadow-sm transition hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
      >
        <p className="text-center text-2xl font-medium text-gray-900 dark:text-white">
          <CardFace
            card={currentCard}
            side={flipped ? "back" : "front"}
            particles={particles}
            highlightMode={highlightMode}
          />
        </p>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {flipped ? "Answer" : "Tap to reveal"}
        </p>
      </button>

      {/* Extra info */}
      {flipped &&
        (currentCard.note ||
          currentCard.reasoning ||
          (currentCard.type === "other" && (currentCard.definition || currentCard.context))) && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50">
            {currentCard.note && (
              <p className="text-gray-700 dark:text-gray-300">{currentCard.note}</p>
            )}
            {currentCard.type === "other" && currentCard.definition && (
              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {currentCard.definition}
              </p>
            )}
            {currentCard.type === "other" && currentCard.context && (
              <p className="mt-0.5 text-gray-600 dark:text-gray-400">
                {currentCard.context}
              </p>
            )}
            {currentCard.reasoning && (
              <p className="mt-2 border-t border-gray-200 pt-2 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Reasoning:
                </span>{" "}
                {currentCard.reasoning}
              </p>
            )}
          </div>
        )}

      {/* Rating buttons (only when flipped) */}
      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {RATING_BUTTONS.map(({ rating, label, color }) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRate(rating)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-3 text-sm font-semibold transition ${color}`}
            >
              {label}
              <IntervalHint cardId={currentCard.id} rating={rating} />
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          {t("flashcards.showAnswer", "Show Answer")}
        </button>
      )}
    </div>
  );
}

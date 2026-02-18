import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeckForLanguage, getParticlesForLanguage } from "@/data/flashcards/loadDeck";
import type { Flashcard, CardSegment } from "@/data/flashcards/types";
import type { ParticleDef } from "@/data/particles/types";

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

function CardContent({
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
    if (highlightMode && (card.type === "word") && card.parts?.length) {
      return <HighlightedText segments={card.parts} particles={particles} highlightMode />;
    }
    if (highlightMode && (card.type === "sentence") && card.words?.length) {
      return <HighlightedText segments={card.words} particles={particles} highlightMode />;
    }
    return <>{card.front}</>;
  }
  return <>{card.back}</>;
}

export function FlashcardTester() {
  const { language } = useLanguage();
  const languageId = language?.id ?? "en";
  const deck = getDeckForLanguage(languageId);
  const particlesData = getParticlesForLanguage(languageId);
  const particles = particlesData?.particles ?? null;

  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [highlightMode, setHighlightMode] = useState(true);

  const cards = deck?.cards ?? [];
  const card = cards[index] as Flashcard | undefined;

  if (!deck) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No flashcard deck for this language yet. Select Korean in the language selector to try the sample deck.
      </p>
    );
  }

  if (!card) {
    return (
      <p className="text-gray-500 dark:text-gray-400">No cards in this deck yet.</p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
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

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-gray-300 bg-white py-12 shadow-sm transition hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
      >
        <p className="text-center text-2xl font-medium text-gray-900 dark:text-white">
          <CardContent
            card={card}
            side={flipped ? "back" : "front"}
            particles={particles}
            highlightMode={highlightMode}
          />
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tap to flip</p>
      </button>

      {(card.note || card.reasoning || (card.type === "other" && (card.definition || card.context))) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50">
          {card.note && <p className="text-gray-700 dark:text-gray-300">{card.note}</p>}
          {card.type === "other" && card.definition && (
            <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">{card.definition}</p>
          )}
          {card.type === "other" && card.context && (
            <p className="mt-0.5 text-gray-600 dark:text-gray-400">{card.context}</p>
          )}
          {card.reasoning && (
            <p className="mt-2 border-t border-gray-200 pt-2 text-gray-600 dark:border-gray-700 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Reasoning:</span> {card.reasoning}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setIndex((i) => (i - 1 + cards.length) % cards.length);
            setFlipped(false);
          }}
          disabled={cards.length <= 1}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        >
          Previous
        </button>
        <span className="py-2 text-sm text-gray-500 dark:text-gray-400">
          {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          onClick={() => {
            setIndex((i) => (i + 1) % cards.length);
            setFlipped(false);
          }}
          disabled={cards.length <= 1}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        >
          Next
        </button>
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        {deck.name} · {cards.length} cards
      </p>
    </div>
  );
}

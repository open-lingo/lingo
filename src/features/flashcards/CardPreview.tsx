import { useState } from "react";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";

export function CardImage({ src, className }: { src: string; className?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-gray-200 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400 ${className ?? ""}`}
        style={{ minHeight: 64 }}
      >
        Image failed to load
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setError(true)}
    />
  );
}
import { PlainText } from "@/shared/components/PlainText";
import type { Flashcard, CardSegment } from "@/features/flashcards/data/types";
import type { ReviewMode } from "./reviewModes";
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
    return <PlainText>{card.front}</PlainText>;
  }
  return <PlainText>{card.back}</PlainText>;
}

type CardPreviewProps = {
  card: Flashcard;
  languageId?: string;
  compact?: boolean;
  reviewMode?: ReviewMode;
};

/** word-first: image only on back. image-first: image on both sides. */
function shouldShowImage(mode: ReviewMode, flipped: boolean): boolean {
  if (mode === "word-first") return flipped; // back only
  return true; // image-first: both sides
}

export function CardPreview({
  card,
  languageId = "ko",
  compact = false,
  reviewMode = "word-first",
}: CardPreviewProps) {
  const [flipped, setFlipped] = useState(false);
  const [highlightMode, setHighlightMode] = useState(true);
  const particlesData = getParticlesForLanguage(languageId);
  const particles = particlesData?.particles ?? null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-gray-300 bg-white py-8 shadow-sm transition hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 ${
          compact ? "min-h-[120px] py-4" : "min-h-[180px]"
        }`}
      >
        {shouldShowImage(reviewMode, flipped) && card.image && (
            <CardImage src={card.image} className="mb-2 max-h-32 w-auto rounded object-contain" />
          )}
        <div
          className={`w-full text-center text-gray-900 dark:text-white ${
            compact ? "[&_.prose]:text-base" : "[&_.prose]:text-lg"
          }`}
        >
          <CardFace
            card={card}
            side={flipped ? "back" : "front"}
            particles={particles}
            highlightMode={highlightMode}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {flipped ? "Answer" : "Tap to reveal"}
        </p>
      </button>
      {flipped &&
        (card.note || card.reasoning || card.definition || card.context) && (
          <div
            className={`rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50 ${
              compact ? "text-xs" : ""
            }`}
          >
            {card.note && (
              <div className="text-gray-700 dark:text-gray-300">
                <PlainText>{card.note}</PlainText>
              </div>
            )}
            {card.definition && (
              <div className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                <PlainText>{card.definition}</PlainText>
              </div>
            )}
            {card.context && (
              <div className="mt-0.5 text-gray-600 dark:text-gray-400">
                <PlainText>{card.context}</PlainText>
              </div>
            )}
            {card.reasoning && (
              <div className="mt-2 border-t border-gray-200 pt-2 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">Reasoning:</span>{" "}
                <PlainText>{card.reasoning}</PlainText>
              </div>
            )}
          </div>
        )}
      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={highlightMode}
          onChange={(e) => setHighlightMode(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
        Highlight particles & roots
      </label>
    </div>
  );
}

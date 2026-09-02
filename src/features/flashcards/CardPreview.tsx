import { useState } from "react";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";

export function CardImage({ src, className }: { src: string; className?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-surface-muted text-xs text-text-muted ${className ?? ""}`}
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
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setError(true)}
    />
  );
}
import { PlainText } from "@/shared/components/PlainText";
import { CardFront } from "./components/CardFront";
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
              className="rounded bg-warning/30 px-0.5"
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
              className="rounded bg-success/30 px-0.5"
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
  face,
}: {
  card: Flashcard;
  side: "front" | "back";
  particles: ParticleDef[] | null;
  highlightMode: boolean;
  face: "prompt" | "answer";
}) {
  const isFront = side === "front";
  if (isFront) {
    if (highlightMode && card.type === "word" && card.parts?.length) {
      return <HighlightedText segments={card.parts} particles={particles} highlightMode />;
    }
    if (highlightMode && card.type === "sentence" && card.words?.length) {
      return <HighlightedText segments={card.words} particles={particles} highlightMode />;
    }
    return (
      <CardFront
        text={card.front}
        reading={card.reading}
        cardId={card.id}
        face={face}
      />
    );
  }
  return <PlainText>{card.back}</PlainText>;
}

type CardPreviewProps = {
  card: Flashcard;
  languageId?: string;
  compact?: boolean;
  reviewMode?: ReviewMode;
  /** Where the note/definition/context/reasoning panel appears relative to
   * the card. "stacked" (default) puts it below; "side" puts it to the
   * right so the card stays vertically centered in its container even when
   * the panel has content. */
  infoPosition?: "stacked" | "side";
};

/** word-first: image only on back. image-first: image on both sides. back-first: image on "front" (back content). */
function shouldShowImage(mode: ReviewMode, flipped: boolean): boolean {
  if (mode === "back-first") return !flipped; // back first = translation + image
  if (mode === "word-first") return flipped;
  return true; // image-first: both sides
}

export function CardPreview({
  card,
  languageId = "ko",
  compact = false,
  reviewMode = "word-first",
  infoPosition = "stacked",
}: CardPreviewProps) {
  const [flipped, setFlipped] = useState(false);
  const [highlightMode, setHighlightMode] = useState(true);
  const particlesData = getParticlesForLanguage(languageId);
  const particles = particlesData?.particles ?? null;

  const hasInfo = !!(card.note || card.reasoning || card.definition || card.context);

  const cardButton = (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className={`flex w-full flex-col items-center justify-center rounded-card border-2 border-border bg-surface py-8 shadow-sm transition hover:border-accent ${
        compact ? "min-h-[120px] py-4" : "min-h-[180px]"
      }`}
    >
      {shouldShowImage(reviewMode, flipped) && card.image && (
        <CardImage src={card.image} className="mb-2 max-h-32 w-auto rounded object-contain" />
      )}
      <div
        className={`w-full text-center text-text-primary ${
          compact ? "[&_.prose]:text-base" : "[&_.prose]:text-lg"
        }`}
      >
        <CardFace
          card={card}
          side={
            reviewMode === "back-first" ? (flipped ? "front" : "back") : flipped ? "back" : "front"
          }
          particles={particles}
          highlightMode={highlightMode}
          face={flipped ? "answer" : "prompt"}
        />
      </div>
      <p className="mt-2 text-xs text-text-muted">
        {flipped ? "Answer" : "Tap to reveal"}
      </p>
    </button>
  );

  const infoPanel = flipped && hasInfo && (
    <div
      className={`rounded-lg border border-border bg-surface-muted p-3 text-sm ${
        compact ? "text-xs" : ""
      }`}
    >
      {card.note && (
        <div className="text-text-secondary">
          <PlainText>{card.note}</PlainText>
        </div>
      )}
      {card.definition && (
        <div className="mt-1 font-medium text-text-primary">
          <PlainText>{card.definition}</PlainText>
        </div>
      )}
      {card.context && (
        <div className="mt-0.5 text-text-muted">
          <PlainText>{card.context}</PlainText>
        </div>
      )}
      {card.reasoning && (
        <div className="mt-2 border-t border-border pt-2 text-text-muted">
          <span className="font-medium text-text-secondary">Reasoning:</span>{" "}
          <PlainText>{card.reasoning}</PlainText>
        </div>
      )}
    </div>
  );

  const highlightToggle = (
    <label className="flex items-center gap-2 text-xs text-text-muted">
      <input
        type="checkbox"
        checked={highlightMode}
        onChange={(e) => setHighlightMode(e.target.checked)}
        className="rounded border-border accent-accent"
      />
      Highlight particles & roots
    </label>
  );

  if (infoPosition === "side") {
    return (
      <div className="flex w-full flex-col items-start gap-4 md:flex-row">
        <div className="w-full space-y-2 md:max-w-[280px]">
          {cardButton}
          {highlightToggle}
        </div>
        {infoPanel && (
          <div className="w-full min-w-0 flex-1 self-center">{infoPanel}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cardButton}
      {infoPanel}
      {highlightToggle}
    </div>
  );
}
